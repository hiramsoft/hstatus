/**
 * This file defines your AngularJS app
 * The underlying router configuration, controllers, services, and directives
 * are all defined by individual files to help keep a manageable codebase.
 *
 * The only thing you likely will change here is adding app-level dependencies like 'ngResource' or similar
 */

import routerConfig from './router.js';
import allControllers from './controllers.js';
import allServices from './services.js';
import allDirectives from './directives.js';

var app = angular.module("es6ngApp", ['ui.router', allControllers, allServices, allDirectives])
    .config(routerConfig)
    // You may add additional configuration here
    ;

export default app;