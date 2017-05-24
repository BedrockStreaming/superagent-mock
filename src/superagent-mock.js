/**
 * Installs the `mock` extension to superagent.
 * @param superagent Superagent instance
 * @param config The mock configuration
 * @param logger Logger callback
 */
module.exports = function (superagent, config, logger) {
  const Request = superagent.Request;
  const logEnabled = !!logger;

  /**
   * Keep the default methods
   */
  const oldEnd = Request.prototype.end;
  const oldAbort = Request.prototype.abort;

  /**
   * Loop over the patterns and use @callback when the @query matches
   */
  const forEachPatternMatch = function () {
    const configLength = config.length;

    return function (query, callback){
      for (let i = 0; i < configLength; i++) {
        if (new RegExp(config[i].pattern, 'g').test(query)){
          callback(config[i]);
        }
      }
    };
  }();

  /**
   * Chains progress events and eventually returns the response
   * @param ProgressEvent (object/function) the ProgressEvent implementation
   * @param request (object) the current request
   *
   * @param progress (object) the progress configuration
   * @param progress.parts (number)
   * @param [progress.delay=0] (number)
   * @param [progress.total=100] (number)
   * @param [progress.lengthComputable=true] (boolean)
   * @param [progress.direction='upload'] (string)
   *
   * @param remainingParts (number) the remaining calls to make
   * @param callback (function) the end response callback
   */
  var handleProgress = function (ProgressEvent, request, progress, remainingParts, callback) {
    setTimeout(function () {
      var total = progress.total || 100;
      var loaded = total * (progress.parts - remainingParts) / progress.parts;
      var lengthComputable = progress.lengthComputable !== false; // default is true
      var event = ProgressEvent.initProgressEvent
        ? ProgressEvent.initProgressEvent('', true, false, lengthComputable, loaded, total) // IE10+
        : new ProgressEvent('', {lengthComputable: lengthComputable, loaded: loaded, total: total});

      if (event.total > 0) {
        event.percent = event.loaded / event.total * 100;
      }
      event.direction = progress.direction || 'upload';

      request.emit('progress', event);

      if (remainingParts > 0) {
        handleProgress(ProgressEvent, request, progress, remainingParts - 1, callback);
      } else {
        callback();
      }
    }, progress.delay || 0);
  };

  /**
   * Override end function
   */
  Request.prototype.end = function (fn) {
    let error = null;
    let path;
    const isNodeServer = this.hasOwnProperty('cookies');
    let response = {};
    const warnings = [];

    if (isNodeServer) { // node server
      const originalPath = this.path;
      this.path = this.url;
      this._appendQueryString(this); // use superagent implementation of adding the query
      path = this.path; // save the url together with the query
      this.path = originalPath; // reverse the addition of query to path by _appendQueryString
    } else { // client
      const originalUrl = this.url;
      this._appendQueryString(this); // use superagent implementation of adding the query
      path = this.url; // save the url together with the query
      this.url = originalUrl; // reverse the addition of query to url by _appendQueryString
    }

    // Attempt to match path against the patterns in fixtures
    let parser = null;
    forEachPatternMatch(path, function (matched) {
      if (!parser) {
        parser = matched;
      } else if (logEnabled) {
        warnings.push(`The pattern ${matched.pattern} matches the query but another one matched first`);
      }
    });

    // For warning purpose
    if (logEnabled) {
      if (parser) {
        if (!parser[this.method.toLowerCase()]) {
          warnings.push(`This pattern was ignored because it doesn't implement the method: ${this.method.toLowerCase()}`);
        }
      } else {
        // attempt to match url against the patterns in fixtures
        forEachPatternMatch(this.url, function (matched) {
          warnings.push(`The pattern ${matched.pattern} was ignored because it doesn't matches the query params`);
        });
      }

      logger({
        matcher: parser && parser.pattern,
        mocked: !!parser,
        url: path,
        method: this.method,
        data: this._data,
        headers: this.header,
        timestamp: new Date().getTime(),
        warnings
      });
    }

    if (!parser) {
      return oldEnd.call(this, fn);
    }

    const match = new RegExp(parser.pattern, 'g').exec(path);

    const context = {};
    try {
      const fixtures = parser.fixtures(match, this._data, this.header, context);
      if (context.cancel === true) {
        return oldEnd.call(this, fn); // mocking was cancelled from within fixtures
      }
      const method = this.method.toLocaleLowerCase();
      const parserMethod = parser[method] || parser.callback;
      response = parserMethod(match, fixtures);
    } catch (err) {
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

    // Check if a callback for progress events was specified as part of the request
    var progressEventsUsed = isNodeServer ? !!this._formData : this.hasListeners && this.hasListeners('progress');

    if (context.progress && progressEventsUsed) {
      var ProgressEvent = global.ProgressEvent || function (type, rest) { // polyfill
          rest.type = type;
          return rest;
      };
      // if no delay for parts was specified but an overall delay was, then divide the delay between the parts.
      if (!context.progress.delay && context.delay) {
        context.progress.delay = context.delay / context.progress.parts;
      }
      handleProgress(ProgressEvent, this, context.progress, context.progress.parts - 1, function () {
        fn(error, response);
      });
    } else if (context.delay) {
      setTimeout(function () {
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
};
