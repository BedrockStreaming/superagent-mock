'use strict';

global.window = {};

// Get the "client" version of superagent
const request = require('superagent/lib/client');

// Get the mock config and expectations
const config = require('./support/config');
const expectations = require('./support/expectations');

// Expose the test cases
module.exports = expectations(request, config, false);
