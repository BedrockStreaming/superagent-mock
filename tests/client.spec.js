'use strict';

// Create specifics component require
var component = require('component-as-module');

// Get the "client" version of superagent
var request = component('node_modules/superagent', function (loader) {
  loader.register('component-emitter', function () {
    return require('superagent/node_modules/component-emitter');
  });

  loader.register('component-reduce', function () {
    return require('superagent/node_modules/reduce-component');
  });

  loader.loadDependency('emitter');
});

// Get the mock config and expectations
var config = require('./support/config');
var expectations = require('./support/expectations');

// Expose the test cases
module.exports = expectations(request, config);
