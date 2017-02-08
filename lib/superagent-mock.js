'use strict';

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
   * Loop over the patterns and use @callback when the @query matches
   */
  var forEachPatternMatch = function () {
    var configLength = config.length;

    return function (query, callback){
      for (var i = 0; i < configLength; i++) {
        if (new RegExp(config[i].pattern, 'g').test(query)){
          callback(config[i]);
        }
      }
    };
  }();

  /**
   * Override end function
   */
  Request.prototype.end = function (fn) {
    var error = null;
    var path;
    var isNodeServer = this.hasOwnProperty('cookies');

    if (isNodeServer) { // node server
      var originalPath = this.path;
      this.path = this.url;
      this._appendQueryString(this); // use superagent implementation of adding the query
      path = this.path; // save the url together with the query
      this.path = originalPath; // reverse the addition of query to path by _appendQueryString
    } else { // client
      var originalUrl = this.url;
      this._appendQueryString(this); // use superagent implementation of adding the query
      path = this.url; // save the url together with the query
      this.url = originalUrl; // reverse the addition of query to url by _appendQueryString
    }

    // Attempt to match path against the patterns in fixtures
    var parser = null;
    forEachPatternMatch(path, function (matched) {
      if (!parser) {
        parser = matched;
      } else if (logEnabled) {
        currentLog.warnings = (currentLog.warnings || []).concat([
          'This other pattern matches the query but was ignored: ' + matched.pattern
        ]);
      }
    });

    // For warning purpose: attempt to match url against the patterns in fixtures
    if (!parser && logEnabled) {
      forEachPatternMatch(this.url, function (matched) {
        currentLog.warnings = (currentLog.warnings || []).concat([
          'This pattern was ignored because it doesn\'t matches the query params: ' + matched.pattern
        ]);
      });
    }

    if (logEnabled) {
      currentLog.matcher = parser && parser.pattern;
      currentLog.mocked = !!parser;
      currentLog.url = path;
      currentLog.method = this.method;
      currentLog.data = this._data;
      currentLog.headers = this.header;
      currentLog.timestamp = new Date().getTime();
      flushLog();
    }

    if (!parser) {
      return oldEnd.call(this, fn);
    }

    var match = new RegExp(parser.pattern, 'g').exec(path);

    var context = {};
    try {
      var fixtures = parser.fixtures(match, this._data, this.header, context);
      if (context.cancel === true) {
        return oldEnd.call(this, fn); // mocking was cancelled from within fixtures
      }
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

    if (typeof(context.delay) === 'number') {
      setTimeout(function() {
        fn(error, response);
      }, context.delay);
    }
    else {
      fn(error, response);
    }
    return this;
  };

  Request.prototype.abort = function () {
    this.xhr = this.req = {abort: function () {}};

    return oldAbort.call(this);
  };

  return {
    unset: function () {
      Request.prototype.end = oldEnd;
      Request.prototype.abort = oldAbort;
    }
  };
}
