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
  var response = {};

  /**
   * Keep the default methods
   */
  var oldSet = Request.prototype.set;
  var oldSend = Request.prototype.send;
  var oldEnd = Request.prototype.end;

  /**
   * Attempt to match url against the patterns in fixtures.
   */
  function testUrlForPatterns(url) {
    if (parsers[url]) {
      return parsers[url];
    }

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
   * Override set function
   */
  Request.prototype.set = function (headers) {
    var parser = testUrlForPatterns(this.url);
    if (parser) {
      this.headers = headers;

      return this;
    } else {
      return oldSet.apply(this, arguments);
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
        var fixtures = parser.fixtures(match, this.params, this.headers);
        var method = this.method.toLocaleLowerCase();
        var parserMethod = parsers[this.url][method] ? parsers[this.url][method] : parsers[this.url].callback;

        fn(null, parserMethod(match, fixtures));
      } catch(err) {
        response = new superagent.Response({
          res: {
            headers: {},
            setEncoding: function (){},
            on: function (){},
            body: err.responseBody || {},
          },
          req: {
            method: function (){}
          },

          xhr: {
            responseType: '',
            responseText: err.responseText || '',
            getAllResponseHeaders: function () {return 'a header';},
            getResponseHeader: function () {return err.responseHeader || 'a header';}
          }
        });
        response.setStatusProperties(err.message);
        fn(err, response);
      }
    } else {
      oldEnd.call(this, fn);
    }
  };

  return {
    unset: function () {
      Request.prototype.send = oldSend;
      Request.prototype.set = oldSet;
      Request.prototype.end = oldEnd;
    }
  };
}
