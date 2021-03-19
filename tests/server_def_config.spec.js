'use strict';
/**
 * @jest-environment node
 */

// Get the "server" version of superagent
var request = require('superagent');

// Get the mock config and expectations
var config = require('./support/config');
var expectations = require('./support/expectations');

// Expose the test cases
module.exports = expectations(request, {list: config, default: {}}, true);
