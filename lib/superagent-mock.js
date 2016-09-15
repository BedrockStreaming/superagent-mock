'use strict';

var qs = require('qs');

/**
 * Module exports.
 */
module.exports = mock;

/**
 * Installs the `mock` extension to superagent.
 * @param superagent Superagent instance
 * @param config The mock configuration
 * @param logger Logger callback
 */
function mock (superagent, config, logger) {
  var Request = superagent.Request;
  var response = {};
  var currentLog = {};
  var logEnabled = !!logger;

  /**
   * Keep the default methods
   */
  var oldSet = Request.prototype.set;
  var oldSend = Request.prototype.send;
  var oldEnd = Request.prototype.end;
  var oldAbort = Request.prototype.abort;

  /**
   * Flush the current log in the logger method and reset it
   */
  function flushLog() {
    logger(currentLog);

    currentLog = {};
  }

  /**
   * Override send function
   */
  Request.prototype.send = function (data) {
    if (logEnabled) {
      currentLog.data = data;
    }

    this.params = data;

    return this;
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
    if (logEnabled && !isObject(field)) {
      var headerPart = {};
      headerPart[field] = val;
      currentLog.headers = (currentLog.headers || []).concat(headerPart);
    }

    if (isObject(field)) {
        for (var key in field) {
          this.set(key, field[key]);
        }
    } else {
        this.headers = this.headers || {};
        this.headers[field] = val;
    }

    return this;
  };

  /**
   * Override end function
   */
  Request.prototype.end = function (fn) {
    var path = this.url;
    var querystring = '';
    var error = null;

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

    // Attempt to match url against the patterns in fixtures.
    var parser = null;
    for (var i = 0, len = config.length; i < len; i++) {
      if (new RegExp(config[i].pattern, 'g').test(path)){
        if (!parser) {
          parser = config[i];
        } else if (logEnabled) {
          currentLog.warning = 'An other pattern matches this request';
        }
      }
    }

    if (logEnabled) {
      currentLog.matcher = parser && parser.pattern;
      currentLog.mocked = !!parser;
      currentLog.url = path;
      currentLog.method = this.method;
      currentLog.timestamp = new Date().getTime();
      flushLog();
    }

    if (!parser) {
      oldSet.call(this, this.headers);
      oldSend.call(this, this.params);
      return oldEnd.call(this, fn);
    }

    var match = new RegExp(parser.pattern, 'g').exec(path);

    try {
      var fixtures = parser.fixtures(match, this.params, this.headers);
      var method = this.method.toLocaleLowerCase();
      var parserMethod = parser[method] || parser.callback;

      response = parserMethod(match, fixtures);
    } catch(err) {
        error = err;
        response = new superagent.Response({
          res: {
            headers: {},
            setEncoding: function (){},
            on: function (){},
            body: err.responseBody || {}
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
      if (response._setStatusProperties) {
        response._setStatusProperties(err.message);
      } else {
        response.setStatusProperties(err.message);
      }
    }

    fn(error, response);
    return this;
  };

  Request.prototype.abort = function () {
    this.xhr = {abort: function () {}};
    this.req = {abort: function () {}};

    return oldAbort.call(this);
  };

  return {
    unset: function () {
      Request.prototype.send = oldSend;
      Request.prototype.set = oldSet;
      Request.prototype.end = oldEnd;
      Request.prototype.abort = oldAbort;
    }
  };
}
