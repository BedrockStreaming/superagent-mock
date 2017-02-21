'use strict';

global.window = {};

// Get the "client" version of superagent
var request = require("superagent/lib/client.js");

// Get the mock config and expectations
var config = require('./support/config');
var expectations = require('./support/expectations');

// Expose the test cases
module.exports = expectations(request, config, false);
