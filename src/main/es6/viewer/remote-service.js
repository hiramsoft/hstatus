import moment from 'moment';

class RemoteService {

    constructor($resource){
        this.$resource = $resource;

        this.defaultDesc = {
            "name": "hStatus",
            "homepage": "http://www.hStatus.com"
        };
    }

    static factory($resource){
        return new RemoteService($resource);
    }



    getCurerntIncidents() {
        return new Promise( (resolve, reject) => {
            this.$resource("data/current.json").get({}).$promise.then( (current) => {
                current.asOfDt = current.asOfDt || moment();
                current.asOfDt = moment(current.asOfDt);
                resolve(current);
            }).catch( (err) => {
                console.log("Failed to retrieve current incidents.  Reverting to hard-coded defaults", err);
                resolve({
                    asOfDt : moment(),
                    status : "ok",
                    incidents : []
                });
            });
        });
    };

    getDescription() {
        return new Promise((resolve, reject) => {
            this.$resource("data/desc.json").get({}).$promise.then( (desc) => {
                desc.name = desc.name || this.defaultDesc.name;
                desc.homepage = desc.homepage || this.defaultDesc.homepage;
                resolve(desc);
            }).catch( (err) => {
                reject(err);
            });
        });
    };
}

RemoteService.factory.$inject = ['$resource'];

export default RemoteService;