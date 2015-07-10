// Angular UI-Router

import $log from 'hlog';

var router = function($stateProvider, $urlRouterProvider, $provide, $httpProvider) {

    // most people use the $provide or $httpProvider to set up authentication flows
    // you're more likely to use them than not, hence why they are included.

    // For any unmatched url, redirect to /
    $urlRouterProvider.otherwise("/check");
    //
    // Now set up the states
    $stateProvider


        ///////////////
        /// Unauthenticated
        //////////////

        .state('unauthed', {
            url: "/",
            abstract: true,
            views: {
                "topnav@" : {
                    template : "<nav></nav>"
                }
            }
        })

        .state('unauthed.check', {
            url: "check",
            views: {
                "content@": {
                    template: "<div></div>",
                    controller: "checkAuthedController"
                }
            }
        })

        .state('unauthed.login', {
            url: "login",
            views: {
                "content@": {
                    templateUrl: "admin/login.body.html",
                    controller : "loginController"
                }
            }
        })

        ///////////////
        /// Authenticated
        //////////////

        .state('authed', {
            url: "/admin",
            abstract: true,
            views: {
                "topnav@" : {
                    templateUrl : "admin/admin.topnav.html",
                    controller: "topnavController"
                }
            }
        })

        .state('authed.incidents', {
            url: "incidents",
            views: {
                "content@": {
                    templateUrl: "admin/incidents.body.html",
                    controller: "incidentsController"
                }
            }
        })

        .state('authed.settings', {
            url: "settings",
            views: {
                "content@":{
                    templateUrl: "admin/settings.body.html",
                    controller: "settingsController"
                }
            }
        })
    ;

};

// Don't forget AngularJS dependency injection
router.$inject = ['$stateProvider', '$urlRouterProvider', '$provide', '$httpProvider'];

export default router;