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
   * Returns true if `obj` is an object.
   */
  function isObject(obj) {
    return obj === Object(obj);
  }

  /**
   * Override set function
   */
  Request.prototype.set = function (field, val) {
    var parser = testUrlForPatterns(this.url);
    if (parser) {
      if (isObject(field)) {
        for (var key in field) {
          this.set(key, field[key]);
        }
      } else {
        this.headers = this.headers || {};
        this.headers[field] = val;
      }
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
            on: function (){}
          },
          req: {
            method: function (){}
          },
          xhr: {
            responseType: '',
            getAllResponseHeaders: function () {return 'a header';},
            getResponseHeader: function () {return 'a header';}
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
