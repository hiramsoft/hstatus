import foundation from 'foundation';
import angular from 'angular';
import angular_resource from 'angular-resource';
import moment from 'moment';
import marked from 'marked';

import RemoteService from './remote-service.js';

var app = angular.module('hStatus', ['ngResource']);

app.filter('fromNow', () => {
    return (dt) => {
        return moment(dt).fromNow()
    };
});

app.filter('calendar', () => {
    return (dt) => {
        return moment(dt).calendar()
    };
});

app.filter('hoursOnly', () => {
    return (dt) => {
        return moment(dt).format("h:mm a");
    };
});

app.filter('daysOnly', () => {
    return (dt) => {
        return moment(dt).format("dddd, MMM D");
    };
});

app.filter('fromDayOfYear', () => {
    return (day) => {
        return moment().dayOfYear(day);
    };
});

app.filter('markdown', ['$sce', ($sce) => {
    return (str) => {
        return $sce.trustAsHtml(marked(str));;
    }
}]);

app.controller('IncidentController', ['$log', '$scope', '$location', '$resource', '$window', '$interval', ($log, $scope, $location, $resource, $window, $interval) => {

    var incidentSvc = new RemoteService($resource);

    $scope.dayGroups = [];
    $scope.beforeNoDayGroup = [];
    $scope.afterNoDayGroup = [];

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

    var stopRefreshingTime = $interval(function(){
            console.log("Updating last refresh time");
            if($scope.hStatus && $scope.hStatus.asOfDt){
                $scope.lastUpdated = moment($scope.hStatus.asOfDt).fromNow()
            }
        },
        1000 * 60); // repeat every minute

    $scope.placeIncidents = (incidents) => {
        var now = moment();
        for(var i=0;i<incidents.length;i++) {
            var incident = incidents[i];
            if (incident.startDt) {
                var startDt = moment(incident.startDt);
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
        }
    };

    $scope.refreshList = () => {
        console.log("Loading current status");
        $scope.isRefreshing = true;
        $scope.provisionDayGroups();

        incidentSvc.getCurerntIncidents().then( (status) => {
            $scope.hStatus = status;

            if($scope.hStatus.incidents)
            {
                if($scope.hStatus.incidents.length > 0)
                {
                    var now = moment();
                    var lastReportedItem = null;
                    for(var i=0; lastReportedItem == null && i<$scope.hStatus.incidents.length;i++){
                        var item = $scope.hStatus.incidents[i];
                        item.startDt = moment(item.startDt);
                        if(item.startDt.isBefore(now)){
                            lastReportedItem = item;
                        }
                    }
                    var thisMorning = moment().startOf('day');
                    if(lastReportedItem) {
                        var lastReported = lastReportedItem.startDt;
                        if (thisMorning.isBefore(lastReported)) {
                            $scope.hStatus.asOfDt = moment(lastReported);
                        }
                        else {
                            $scope.hStatus.asOfDt = thisMorning;
                        }
                    } else {
                        $scope.hStatus.asOfDt = thisMorning;
                    }
                }
                else
                {
                    $scope.hStatus.asOfDt = moment().startOf('day');
                }
                $scope.placeIncidents($scope.hStatus.incidents);
            }
            else
            {

            }
            $scope.lastUpdated = moment($scope.hStatus.asOfDt).fromNow();
            $scope.isRefreshing = false;
            $scope.$digest();
        }).catch( (err) => {
            console.log("Got error condition while fetching incidents", err);
            $scope.hStatus = {
                asOfDt : moment(),
                status : "ok",
                incidents : []
            };
            $scope.isRefreshing = false;
            $scope.lastUpdated = moment().fromNow();
            $scope.$digest();
        });
    };

    $scope.title = "Loading Status powered by Hstatus";

    $scope.refreshDesc = () => {
        console.log("Loading description and components");
        incidentSvc.getDescription().then( (desc) => {
            $scope.title = desc.name + " Status";
            $window.document.title = $scope.title;
            $scope.desc = desc;
            $scope.$digest();
        }).catch((err) => {
            $scope.desc = {
                name: "hStatus is ready for you to configure",
                homepage: "https://www.hStatus.com",
                is404: true
            };
            $window.document.title = $scope.desc.name;
            $scope.$digest();
        });
    };

    $scope.refreshList();
    $scope.refreshDesc();
}]);


angular.element(document).ready(() => {
    angular.bootstrap(document, [app.name], {strictDi: true});
});