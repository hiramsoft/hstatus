import RemoteService from './authed-remote-service.js';
import $log from 'hlog';

var ADMIN_SETTINGS_KEY = "data/admin-settings.json";

class AdminSettingsService {

    constructor() {
        this.HIRAM_PAGES_LOGIN_LINK = "";
        this.HSTATUS_PUBLIC_SITE = "";
        this.remoteService = new RemoteService();
    }

    /**
     * For Angular DI
     */
    static factory() {
        return new AdminSettingsService();
    }

    isConfigured(){
        return (
            this.HIRAM_PAGES_LOGIN_LINK &&
            this.HIRAM_PAGES_LOGIN_LINK.length > 0 &&
            this.HSTATUS_PUBLIC_SITE &&
            this.HSTATUS_PUBLIC_SITE.length > 0
        );
    }

    getLoginLink(){
        return this.HIRAM_PAGES_LOGIN_LINK;
    }

    setLoginLink(newLink){
        this.HIRAM_PAGES_LOGIN_LINK = newLink;
    }

    getPublicSite(){
        return this.HSTATUS_PUBLIC_SITE;
    }

    setPublicSite(newSite){
        this.HSTATUS_PUBLIC_SITE = newSite;
    }

    load(){
        if(this.isConfigured()){
            return new Promise( (resolve, reject) => {
                resolve(true);
            });
        }
        else {
            return this.loadNoCache();
        }
    }

    loadNoCache(){
        return new Promise( (resolve, reject) => {
            this.remoteService.get(ADMIN_SETTINGS_KEY).then((existingSettingsStr) => {
                var existingSettings = JSON.parse(existingSettingsStr);
                this.HIRAM_PAGES_LOGIN_LINK = existingSettings.hpLoginLink;
                this.HSTATUS_PUBLIC_SITE = existingSettings.hStatusPublicSite;
                if(this.isConfigured()){
                    resolve(true);
                } else {
                    reject("While we retrieved admin-settings.json, it does not have valid values");
                }
            }).catch((err) => {
                $log.debug("No admin settings, returning default");
                reject(err);
            })
        });
    }

    /**
     * In the check-auth stage there are no AWS credentials, so we try with basic XHR
     * @returns {Promise}
     */
    loadNoAuth(){
        return new Promise( (resolve, reject) => {
            this.fetchItem(ADMIN_SETTINGS_KEY).then( (existingSettingsStr) => {
                var existingSettings = JSON.parse(existingSettingsStr);
                this.HIRAM_PAGES_LOGIN_LINK = existingSettings.hpLoginLink;
                this.HSTATUS_PUBLIC_SITE = existingSettings.hStatusPublicSite;
                if(this.isConfigured()){
                    resolve(true);
                } else {
                    reject("While we retrieved admin-settings.json, it does not have valid values");
                }
            }).catch( (err) => {
                $log.debug("Admin key not available");
                reject(err);
            })
        })
    }

    fetchItem(path){
        var self = this;
        return new Promise(function (resolve, reject) {
            try {
                function reqListener(evt) {
                    if(evt.target.status == 200) {
                        resolve(evt.target.responseText)
                    } else {
                        reject(evt.target.statusText);
                    }
                }

                var oReq = new XMLHttpRequest();

                oReq.onload = reqListener;
                oReq.onerror = function (evt) {
                    reject(evt);
                };

                oReq.open("GET", path, true);
                oReq.send();
            }
            catch(err){
                reject(err);
            }
        });
    };

    save(){
        return new Promise( (resolve, reject) => {
            var toSaveData = {
                hpLoginLink : this.HIRAM_PAGES_LOGIN_LINK,
                hStatusPublicSite : this.HSTATUS_PUBLIC_SITE
            };
            this.remoteService.set(ADMIN_SETTINGS_KEY, JSON.stringify(toSaveData) ).then((result) => {
                resolve(result);
            }).catch((err) => {
                reject(err);
            })
        });
    }
};

AdminSettingsService.factory.$inject = [];

export default AdminSettingsService;