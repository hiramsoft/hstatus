var moduleName = "ngApp.directives";

import defaultFormatters from './directive/default-formatters.js';

var app = angular.module(moduleName, []);

for(var formatter of defaultFormatters){
    app.filter(formatter.name, formatter.fn);
}

export default moduleName;