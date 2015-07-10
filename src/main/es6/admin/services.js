var moduleName = "ngApp.services";

import moment from 'moment';

import authedRemoteService from './service/authed-remote-service.js';
import adminSettingsService from './service/admin-settings-service.js';

angular.module(moduleName, [])
    // how to provide dependencies for legacy dependency injection
    .factory('authedRemoteService', authedRemoteService.factory)
    .factory('adminSettingsService', adminSettingsService.factory)
;

export default moduleName;