'use strict';

var qs = require('qs');

/**
 * Module exports.
 */
module.exports = mock;

/**
 * Installs the `mock` extension to superagent.
 */
function mock (superagent, config) {
  var Request = superagent.Request;
  var parsers = Object.create(null);

  /**
   * Keep the default methods
   */
  var oldGet = superagent.get;
  var oldPost = superagent.post;
  var oldPut = superagent.put;
  var oldSend = Request.prototype.send;
  var oldEnd = Request.prototype.end;

  /**
   * Attempt to match url against the patterns in fixtures.
   */
  function testUrlForPatterns(url) {
    if (parsers.hasOwnProperty(url)) { return parsers[url]; }

    var match = config.filter(function (parser) {
      return new RegExp(parser.pattern, 'g').test(url);
    })[0] || null;

    parsers[url] = match;
    
    return match;
  }

  /**
   * Override send function
   */
  Request.prototype.send = function (data) {

    var parser = testUrlForPatterns(this.url);
    if (parser) {
      this.params = data;

      return this;
    } else {
      return oldSend.call(this, data);
    }

  };

  /**
   * Override end function
   */
  Request.prototype.end = function (fn) {

    var path = this.url;
    var querystring = '';

    if (this._query) {
      querystring += this._query.join('&');
    } else {
      if (this.qs) {
        querystring += qs.stringify(this.qs);
      }
      if (this.qsRaw) {
        querystring += this.qsRaw.join('&');
      }
    }


    if (querystring.length) {
      path += (~path.indexOf('?') ? '&' : '?') + querystring;
    }

    var parser = testUrlForPatterns(this.url);

    if (parser) {
      var match = new RegExp(parser.pattern, 'g').exec(path);

      try {
        var fixtures = parser.fixtures(match, this.params);
        fn(null, parsers[this.url].callback(match, fixtures));
      } catch(err) {
        fn(err, undefined);
      }
    } else {
      oldEnd.call(this, fn);
    }
  };
}
