System.config({
  "baseURL": "/",
  "transpiler": "babel",
  "babelOptions": {
    "optional": [
      "runtime"
    ]
  },
  "paths": {
    "*": "src/main/es6/*",
    "github:*": "jspm_packages/github/*.js",
    "npm:*": "jspm_packages/npm/*.js"
  }
});

System.config({
  "map": {
    "angular": "github:angular/bower-angular@1.3.15",
    "angular-resource": "github:angular/bower-angular-resource@1.3.15",
    "angular-ui-router": "github:angular-ui/ui-router@0.2.13",
    "babel": "npm:babel@4.7.16",
    "babel-runtime": "npm:babel-runtime@4.7.16",
    "bootstrap": "github:twbs/bootstrap@3.3.4",
    "marked": "github:chjj/marked@0.3.3",
    "core-js": "npm:core-js@0.9.13",
    "foundation": "github:zurb/bower-foundation@5.5.2",
    "hlog": "github:hiramsoft/es6-logger@0.0.3",
    "jquery": "github:components/jquery@2.1.4",
    "lodash": "npm:lodash@3.6.0",
    "moment": "github:moment/moment@2.9.0",
    "spin": "github:fgnass/spin.js@2.0.2",
    "stranger82/angular-utf8-base64": "github:stranger82/angular-utf8-base64@0.0.5",
    "urish/angular-spinner": "github:urish/angular-spinner@0.6.1",
    "github:angular-ui/ui-router@0.2.13": {
      "angular": "github:angular/bower-angular@1.3.15"
    },
    "github:jspm/nodelibs-process@0.1.1": {
      "process": "npm:process@0.10.1"
    },
    "github:twbs/bootstrap@3.3.4": {
      "jquery": "github:components/jquery@2.1.4"
    },
    "github:zurb/bower-foundation@5.5.2": {
      "jquery": "github:components/jquery@2.1.4"
    },
    "npm:babel-runtime@4.7.16": {
      "process": "github:jspm/nodelibs-process@0.1.1"
    },
    "npm:core-js@0.9.13": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "process": "github:jspm/nodelibs-process@0.1.1",
      "systemjs-json": "github:systemjs/plugin-json@0.1.0"
    },
    "npm:lodash@3.6.0": {
      "process": "github:jspm/nodelibs-process@0.1.1"
    }
  }
});

