import _ from 'lodash';
import moment from 'moment';

export default{
    name: "incidentsController",
    def: ['$log', '$scope', '$rootScope', '$stateParams', '$state', 'authedRemoteService', function ($log, $scope, $rootScope, $stateParams, $state, aRemoteService) {

        $scope.dayGroups = [];
        $scope.beforeNoDayGroup = [];
        $scope.afterNoDayGroup = [];
        $scope.incidents = [];

        $scope.recalculateIncidentList = () => {
            $scope.provisionDayGroups();

            $scope.incidents = _($scope.incidents)
                .filter( (item) => {
                    return item.startDt != null;
                }).sortBy( (item) => {
                    item.startDt = moment(item.startDt);
                    return -item.startDt.unix();
                }).value();

            $scope.placeIncidents($scope.incidents);
        };

        $scope.guid = () => {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }
            return s4() + s4() + s4();
        };

        $scope.provisionDayGroups = () => {
            var daysBack = 15;
            $scope.dayGroups = [];
            $scope.beforeNoDayGroup = [];
            $scope.afterNoDayGroup = [];
            var now = moment();
            for (var i = 0; i < daysBack; i++) {
                // count backwards, and moment is mutable!
                var copyNow = moment(now);
                copyNow.subtract(i, 'days').startOf('day');
                $scope.dayGroups[i] = {
                    "dt": copyNow,
                    "incidents" : []
                };
            }
        };

        $scope.placeIncidents = (incidents) => {
            var now = moment();
            for(var i=0;i<incidents.length;i++) {
                var incident = incidents[i];
                if (incident.startDt) {
                    var startDt = moment(incident.startDt);
                    incident.date = startDt.toDate();
                    incident.time = new Date();
                    incident.time.setHours(startDt.hours());
                    incident.time.setMinutes(startDt.minutes());
                    incident.time.setSeconds(0);
                    incident.time.setMilliseconds(0);
                    var dayNum = now.diff(startDt.startOf('day'), 'days');
                    var dayGroup = $scope.dayGroups[dayNum];
                    if(dayGroup)
                    {
                        dayGroup.incidents.push(incident);
                    }
                    else
                    {
                        if(startDt.isAfter(now)){
                            $scope.afterNoDayGroup.push(incident);
                        } else {
                            $scope.beforeNoDayGroup.push(incident);
                        }
                        $log.warn("No daygroup to place incident: " + dayNum);
                        $log.warn(incident);
                    }
                }
            };
        };

        $scope.makeNewIncident = () => {
            var now = new Date();
            now.setMilliseconds(0);
            now.setSeconds(0);

            return {
                'iId' : 'anything',
                'message' : '',
                'date': now,
                'time' : now,
                'statusColor' : 'unknown'
            };
        };

        $scope.newIncident = $scope.makeNewIncident();

        $scope.prependIncident = () => {
            var newIncident = _.cloneDeep($scope.newIncident);

            newIncident.edit = true;
            newIncident.iId = $scope.guid();
            newIncident.isNew = true;

            $scope.convertDt(newIncident);

            $scope.incidents.splice(0,0, newIncident);
            $scope.newIncident = $scope.makeNewIncident();

            // TODO: Implement a diff approach
            $scope.recalculateIncidentList();


            // TODO: Mark unsaved
        };

        $scope.convertDt = (incident) => {
            var d = incident.date;
            var t = incident.time;

            // Why are these split into date and time components?
            // Because Chrome and Firefox no longer support the datetime input type
            incident.startDt = moment();
            incident.startDt.set('year', d.getFullYear());
            incident.startDt.set('month', d.getMonth());
            incident.startDt.set('date', d.getDate());
            incident.startDt.set('hour', t.getHours());
            incident.startDt.set('minute', t.getMinutes());
            incident.startDt.set('second', t.getSeconds());

        };

        $scope.saveOneIncident = (incident) => {
            incident.edit = false;
            incident.isNew = false;

            $scope.convertDt(incident);

            $scope.recalculateIncidentList();

            $scope.saveIncidents();
        };

        $scope.deleteIncident = (incident) => {

            $scope.incidents = _($scope.incidents)
                .filter( (i) => {
                    // can take advantage of JS references
                    return (i.iId != incident.iId);
                }).value();

            $scope.recalculateIncidentList();

            if(!incident.isNew) {
                $scope.saveIncidents();
            }
        };

        $scope.getIncidents = () => {
            $scope.isRefreshing = true;
            aRemoteService.get("data/current.json").then( (incidentsJson) => {
                var incidentsWrapper = JSON.parse(incidentsJson);
                if(incidentsWrapper) {
                    $scope.incidents = incidentsWrapper.incidents;
                }
                else{
                    $scope.incidents = [];
                }

                $scope.recalculateIncidentList();
                $scope.isRefreshing = false;
                $scope.$digest();
            }).catch( (err) => {
                $scope.incidents = [];
                $log.warn(err);
                $rootScope.$broadcast('$rex', err);
                $scope.isRefreshing = false;
                $scope.$digest();
            });
        };

        $scope.getIncidents();

        $scope.saveIncidents = () => {
            var cleanedIncidents = _($scope.incidents)
                .map( (incident) => {
                    // whitelist approved values to save since angular and UI are writing directly to the model
                    return {
                        iId : incident.iId,
                        startDt : incident.startDt,
                        message: incident.message,
                        statusColor: incident.statusColor
                    }
                }).value();

            var incidentsJson = JSON.stringify({
                "asOfDt": moment(),
                "incidents" : cleanedIncidents
            });
            aRemoteService.set("data/current.json", incidentsJson).then( (result) => {
                // TODO: Provide feedback in the UI
                $scope.$digest();
            }).catch( (err) => {
                $rootScope.$broadcast('$rex', err);
                $log.warn(err);
                $scope.$digest();
            })
        };

    }]
}