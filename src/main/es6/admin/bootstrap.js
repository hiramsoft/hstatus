/**
 * This is the top-level entry point for your application.
 * Because of how es6 + traceur interacts with the DOM, the traditional
 * 1.X AngularJS hooks don't work.  Instead, we need to manually
 * attach your AngularJS application to the Document DOM element.
 *
 * This file, therefore, refers to the process of bootstrapping
 * AngularJS to the DOM and not the popular CSS+JavaScript framework
 * "Twitter Bootstrap"
 **/

// These are the moral equivalent of "global includes" and are available "everywhere."
// However, as a best practice I recommend that you should not rely on globals and instead
// include the frameworks you need where you need them.  Assume the compiler will do the right thing
// unless and until you discover it doesn't.
// See the JSPM package.json for information on these dependencies
import $ from 'jquery'; // AngularJS 1.x dependency
import foundation from 'foundation'; // twitter bootstrap
import angular from 'angular';
import angular_ui_router from 'angular-ui-router';

import ngApp from './ng-app.js'

angular.element(document).ready(function() {
    angular.bootstrap(document, [ngApp.name], {strictDi: true});
});