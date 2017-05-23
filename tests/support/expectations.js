'use strict';

var http = require('http');

module.exports = function (request, config, isServer) {
  var headers = null;
  var superagentMock;
  var currentLog = null;
  var logger = function (log) {
    currentLog = log;
  };
  var superagentPackage = require('superagent/package.json');
  var superagentUserAgentHeader = isServer ? {'User-Agent': 'node-superagent/' + superagentPackage.version} : {};
  var originalSetTimeout = setTimeout;

  beforeEach(function (go) {
    // Stubbing the superagent method
    request.Request.prototype.end = function (fn) {
      fn(null, 'Real call done');
    };

    var oldSet = request.Request.prototype.set;
    request.Request.prototype.set = function (field, value) {
      if (typeof field === 'object') { // spy on set to collect the used arguments
        headers = field;
      }

      return oldSet.call(this, field, value);
    };

    // Stub setTimeout
    Object.defineProperty(global, 'setTimeout', {
      value: function(callbackFunc, timeout) {
        if (!global.setTimeout.calls) {
          global.setTimeout.calls = [];
        }
        global.setTimeout.calls.push([callbackFunc, timeout]); // spy on calls made to setTimeout
        callbackFunc();
      }
    });

    // Init module
    superagentMock = require('./../../src/superagent-mock')(request, config, logger);

    go();
  });

  afterEach(function (go) {
    superagentMock.unset();
    headers = null;
    currentLog = null;
    // restore setTimeout
    Object.defineProperty(global, 'setTimeout', { value: originalSetTimeout });

    go();
  });

  describe('Lib', function () {
    it('handle reset of mock', function (done) {
      superagentMock.unset();

      request.get('https://callback.method.example').end(function (err, result) {
        expect(!err).toBe(true);
        expect(result).toBe('Real call done');
        done();
      });
    });
  });

  describe('Method GET', function () {
    it('matching simple request', function (done) {
      request.get('https://domain.example/666').end(function (err, result) {
        expect(!err).toBe(true);
        expect(result.match[1]).toBe('666');
        expect(result.data).toBe('Fixture !');
        expect(result.code).toBe(200);
        done();
      });
    });

    it('matching simple request with default callback', function (done) {
      request.get('https://callback.method.example').end(function (err, result) {
        expect(!err).toBe(true);
        expect(result.data).toBe('Fixture !');
        done();
      });
    });

    it('unmatching simple request', function (done) {
      request.get('https://dummy.domain/666').end(function (err, result) {
        expect(!err).toBe(true);
        expect(result).toBe('Real call done');
        done();
      });
    });

    it('matching parametrized request (object)', function (done) {
      request.get('https://domain.params.example/list')
        .query({limit: 10})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('limit=10')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('matching double parametrized request (object)', function (done) {
      request.get('https://domain.params.example/list')
        .query({limit: 10, offset: 30})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('limit=10')).not.toBe(-1);
          expect(result.match.indexOf('offset=30')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('matching parametrized request (string)', function (done) {
      request.get('https://domain.params.example/list')
        .query('limit=10')
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('limit=10')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('matching double parametrized request (string)', function (done) {
      request.get('https://domain.params.example/list')
        .query('limit=10&offset=40')
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('limit=10')).not.toBe(-1);
          expect(result.match.indexOf('offset=40')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('matching strict parametrized request (with url)', function (done) {
      request.get('https://domain.strict-params.example/search?q=word&page=1')
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('q=word')).not.toBe(-1);
          expect(result.match.indexOf('page=1')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('matching strict parametrized request (mixed)', function (done) {
      request.get('https://domain.strict-params.example/search?q=word')
        .query({page: 1})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('q=word')).not.toBe(-1);
          expect(result.match.indexOf('page=1')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('unmatching strict parametrized request (missing parameter)', function (done) {
      request.get('https://domain.strict-params.example/search')
        .query({q: 'word'})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result).toBe('Real call done');
          done();
        });
    });

    it('unmatching strict parametrized request (wrong parameter)', function (done) {
      request.get('https://domain.strict-params.example/search?q=word')
        .query({q: 'word', limit: 1})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result).toBe('Real call done');
          done();
        });
    });

    it('matching parametrized request (no parameters)', function (done) {
      request.get('https://domain.params.example/list')
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('unmatching parametrized request (object)', function (done) {
      request.get('https://dummy.domain.params.example/list')
        .query({limit: 10})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result).toBe('Real call done');
          done();
        });
    });

    it('passing matched patterns to fixtures', function (done) {
      var url = 'https://match.example/foo';
      request.get(url)
        .end(function (err, result) {
          expect(result.data).toBe('foo');
          expect(currentLog.warnings).toEqual(['This other pattern matches the query but was ignored: https://match.example/foo']);
          done();
        });
    });

    it('attempt to match without query params', function (done) {
      var url = 'https://forget.query.params';
      request.get(url)
        .query({param: 'forget'})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result).toBe('Real call done');
          expect(currentLog.warnings).toEqual([
            'This pattern was ignored because it doesn\'t matches the query params: https://forget.query.params$'
          ]);
          done();
        });
    });

    it('catches not found error and response it', function (done) {
      request.get('https://error.example/404')
        .end(function (err, result) {
          expect(err).not.toBe(null);
          expect(err.status).toBe(404);
          expect(err.response).toBe(http.STATUS_CODES[404]);
          expect(result.notFound).toBeTruthy();
          done();
        });
    });

    it('catches unauthorized error and response it', function (done) {
      request.get('https://error.example/401')
        .end(function (err, result) {
          expect(err).not.toBe(null);
          expect(err.status).toBe(401);
          expect(err.response).toBe(http.STATUS_CODES[401]);
          expect(result.unauthorized).toBeTruthy();
          done();
        });
    });

    it('also can use "send" method', function (done) {
      request.get('https://domain.send.example/666')
        .send({superhero: 'me'})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match[1]).toBe('666');
          expect(result.data).toBe('Fixture ! - superhero:me');
          done();
        });
    });

    it('setting headers', function (done) {
      request.get('https://authorized.example/')
        .set({Authorization: 'valid_token'})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.data).toBe('your token: valid_token');
          done();
        });
    });

    it('aborting simple request', function (done) {
      request.get('https://domain.example/666').abort();

      done();
    });
  });

  describe('Method POST', function () {
    it('matching simple request', function (done) {
      request.post('https://domain.example/666').end(function (err, result) {
        expect(!err).toBe(true);
        expect(result.match[1]).toBe('666');
        expect(result.data).toBe('Fixture !');
        expect(result.code).toBe(201);
        done();
      });
    });

    it('matching simple request with default callback', function (done) {
      request.post('https://callback.method.example').end(function (err, result) {
        expect(!err).toBe(true);
        expect(result.data).toBe('Fixture !');
        done();
      });
    });

    it('unmatching simple request', function (done) {
      request.post('https://dummy.domain/666').end(function (err, result) {
        expect(!err).toBe(true);
        expect(result).toBe('Real call done');
        done();
      });
    });

    it('matching parametrized request (object)', function (done) {
      request.post('https://domain.params.example/list')
        .query({limit: 10})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('limit=10')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('matching double parametrized request (object)', function (done) {
      request.post('https://domain.params.example/list')
        .query({limit: 10, offset: 30})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('limit=10')).not.toBe(-1);
          expect(result.match.indexOf('offset=30')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('matching parametrized request (string)', function (done) {
      request.post('https://domain.params.example/list')
        .query('limit=10')
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('limit=10')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('matching double parametrized request (string)', function (done) {
      request.post('https://domain.params.example/list')
        .query('limit=10&offset=40')
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('limit=10')).not.toBe(-1);
          expect(result.match.indexOf('offset=40')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('matching strict parametrized request (with url)', function (done) {
      request.post('https://domain.strict-params.example/search?q=word&page=1')
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('q=word')).not.toBe(-1);
          expect(result.match.indexOf('page=1')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('matching strict parametrized request (mixed)', function (done) {
      request.post('https://domain.strict-params.example/search?q=word')
        .query({page: 1})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('q=word')).not.toBe(-1);
          expect(result.match.indexOf('page=1')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('unmatching strict parametrized request (missing parameter)', function (done) {
      request.post('https://domain.strict-params.example/search')
        .query({q: 'word'})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result).toBe('Real call done');
          done();
        });
    });

    it('unmatching strict parametrized request (wrong parameter)', function (done) {
      request.post('https://domain.strict-params.example/search?q=word')
        .query({q: 'word', limit: 1})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result).toBe('Real call done');
          done();
        });
    });

    it('matching parametrized request (no parameters)', function (done) {
      request.post('https://domain.params.example/list')
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('unmatching parametrized request (object)', function (done) {
      request.post('https://dummy.domain.params.example/list')
        .query({limit: 10})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result).toBe('Real call done');
          done();
        });
    });

    it('passing matched patterns to fixtures', function (done) {
      var url = 'https://match.example/foo';
      request.post(url)
        .end(function (err, result) {
          expect(result.data).toBe('foo');
          expect(currentLog.warnings).toEqual(['This other pattern matches the query but was ignored: https://match.example/foo']);
          done();
        });
    });

    it('attempt to match without query params', function (done) {
      var url = 'https://forget.query.params';
      request.post(url)
        .query({param: 'forget'})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result).toBe('Real call done');
          expect(currentLog.warnings).toEqual([
            'This pattern was ignored because it doesn\'t matches the query params: https://forget.query.params$'
          ]);
          done();
        });
    });

    it('catches not found error and response it', function (done) {
      request.post('https://error.example/404')
        .end(function (err, result) {
          expect(err).not.toBe(null);
          expect(err.status).toBe(404);
          expect(err.response).toBe(http.STATUS_CODES[404]);
          expect(result.notFound).toBeTruthy()
          done();
        });
    });

    it('catches validation error and response it', function (done) {
      request.post('https://validation.example')
        .end(function (err, result) {
          expect(err).not.toBe(null);
          expect(err.status).toBe(422);
          expect(err.response).toBe(http.STATUS_CODES[422]);
          expect(result.body).toEqual({password: 'missing'});
          done();
        });
    });

    it('catches validation errors and sets text', function (done) {
      request.post('https://error.example/401')
        .end(function (err, result) {
          expect(err).not.toBe(null);
          expect(err.status).toBe(401);
          expect(err.response).toBe(http.STATUS_CODES[401]);
          expect(result.unauthorized).toBeTruthy()
          done();
        });
    });

    it('setting headers', function (done) {
      request.post('https://authorized.example/')
        .set({Authorization: 'valid_token'})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.data).toBe('your token: valid_token');
          done();
        });
    });

    it('setting multiple headers', function (done) {
      request.post('https://multiple-headers.example/')
        .set('X-API-Key', 'foobar')
        .set('Content-Type', 'application/json')
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.data).toBe('X-API-Key: foobar; Content-Type: application/json');
          done();
        });
    });

    it('aborting simple request', function (done) {
      request.post('https://domain.example/666').abort();

      done();
    });
  });

  describe('Method PUT', function () {
    it('matching simple request', function (done) {
      request.put('https://domain.example/666').end(function (err, result) {
        expect(!err).toBe(true);
        expect(result.match[1]).toBe('666');
        expect(result.data).toBe('Fixture !');
        expect(result.code).toBe(201);
        done();
      });
    });

    it('matching simple request with default callback', function (done) {
      request.put('https://callback.method.example').end(function (err, result) {
        expect(!err).toBe(true);
        expect(result.data).toBe('Fixture !');
        done();
      });
    });

    it('unmatching simple request', function (done) {
      request.put('https://dummy.domain/666').end(function (err, result) {
        expect(!err).toBe(true);
        expect(result).toBe('Real call done');
        done();
      });
    });

    it('matching parametrized request (object)', function (done) {
      request.put('https://domain.params.example/list')
        .query({limit: 10})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('limit=10')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('matching double parametrized request (object)', function (done) {
      request.put('https://domain.params.example/list')
        .query({limit: 10, offset: 30})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('limit=10')).not.toBe(-1);
          expect(result.match.indexOf('offset=30')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('matching parametrized request (string)', function (done) {
      request.put('https://domain.params.example/list')
        .query('limit=10')
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('limit=10')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('matching double parametrized request (string)', function (done) {
      request.put('https://domain.params.example/list')
        .query('limit=10&offset=40')
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('limit=10')).not.toBe(-1);
          expect(result.match.indexOf('offset=40')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('matching strict parametrized request (with url)', function (done) {
      request.put('https://domain.strict-params.example/search?q=word&page=1')
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('q=word')).not.toBe(-1);
          expect(result.match.indexOf('page=1')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('matching strict parametrized request (mixed)', function (done) {
      request.put('https://domain.strict-params.example/search?q=word')
        .query({page: 1})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.match.indexOf('q=word')).not.toBe(-1);
          expect(result.match.indexOf('page=1')).not.toBe(-1);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('unmatching strict parametrized request (missing parameter)', function (done) {
      request.put('https://domain.strict-params.example/search')
        .query({q: 'word'})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result).toBe('Real call done');
          done();
        });
    });

    it('unmatching strict parametrized request (wrong parameter)', function (done) {
      request.put('https://domain.strict-params.example/search?q=word')
        .query({q: 'word', limit: 1})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result).toBe('Real call done');
          done();
        });
    });

    it('matching parametrized request (no parameters)', function (done) {
      request.put('https://domain.params.example/list')
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.data).toBe('Fixture !');
          done();
        });
    });

    it('unmatching parametrized request (object)', function (done) {
      request.put('https://dummy.domain.params.example/list')
        .query({limit: 10})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result).toBe('Real call done');
          done();
        });
    });

    it('passing matched patterns to fixtures', function (done) {
      var url = 'https://match.example/foo';
      request.put(url)
        .end(function (err, result) {
          expect(result.data).toBe('foo');
          expect(currentLog.warnings).toEqual(['This other pattern matches the query but was ignored: https://match.example/foo']);
          done();
        });
    });

    it('attempt to match without query params', function (done) {
      var url = 'https://forget.query.params';
      request.put(url)
        .query({param: 'forget'})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result).toBe('Real call done');
          expect(currentLog.warnings).toEqual([
            'This pattern was ignored because it doesn\'t matches the query params: https://forget.query.params$'
          ]);
          done();
        });
    });

    it('catches not found error and response it', function (done) {
      request.put('https://error.example/404')
        .end(function (err, result) {
          expect(err).not.toBe(null);
          expect(err.status).toBe(404);
          expect(err.response).toBe(http.STATUS_CODES[404]);
          expect(result.notFound).toBeTruthy();
          done();
        });
    });

    it('catches unauthorized error and response it', function (done) {
      request.put('https://error.example/401')
        .end(function (err, result) {
          expect(err).not.toBe(null);
          expect(err.status).toBe(401);
          expect(err.response).toBe(http.STATUS_CODES[401]);
          expect(result.unauthorized).toBeTruthy();
          done();
        });
    });

    it('aborting simple request', function (done) {
      request.put('https://domain.example/666').abort();

      done();
    });
  });

  describe('Header setting', function () {
    it('setting mocked headers', function (done) {
      request.put('https://authorized.example/')
        .set({Authorization: 'valid_token'})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result.data).toBe('your token: valid_token');
          done();
        });
    });

    it('setting real headers', function (done) {
      request.put('https://dummy.example/')
        .set({real: 'foo'})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result).toBe('Real call done');
          expect(headers).toEqual({real: 'foo'});
          done();
        });
    });
  });

  describe('end', function () {
    it('returns request object', function (done) {
      var requestObject = request.get('https://domain.example/test')
        .set({header: 'value'})
        .end(function(err, result){});

      expect(requestObject.url).toBe('https://domain.example/test');
      expect(requestObject.header).toEqual(Object.assign({header: 'value'}, superagentUserAgentHeader));
      done();
    });

    it('is only called once', function (done) {
      var calls = 0;
      expect(function() {
        request.get('https://domain.example/666').end(function (err) {
          calls++;
          expect(!err).toBe(true);
          throw new Error('test');
        });
      }).toThrow();
      expect(calls).toBe(1);
      done();
    });

    it('not calling real api if not cancelled', function (done) {
      request.put('https://context.cancel.example/mock-call')
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result).not.toBe('Real call done');
          done();
        });
    });

    it('calling real api when cancelled', function (done) {
      request.put('https://context.cancel.example/real-call')
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(result).toBe('Real call done');
          done();
        });
    });

    it('calling callback function after specified delay', function (done) {
      request.put('https://context.delay.example/test')
        .end(function (err, result) {
          expect(result.data).toBe('test'); // just to see the arguments are passed as usual
          expect(setTimeout.calls.length).toBe(1); // setTimeout has been called
          done();
        });
    });

    it('calling callback function after emitting progress events', function (done) {
      var parts = 3;
      var currentPart = 1;
      var currentRequest = request.put('https://context.progress.example/' + parts)
        .on('progress', function (e) {
          expect(e.total).toBe(100);
          // ProgressEvent loaded type is long
          expect(e.loaded).toBe(Math.trunc((100 / parts) * currentPart++));
        });
      if (isServer) {
        // force creation of formData (the only case where progress is used on node)
        currentRequest = currentRequest.field('name','val');
      }
      currentRequest.end(function (err, result) {
        expect(result.data).toBe(Number(parts).toString()); // just to see the arguments are passed as usual
        expect(setTimeout.calls.length).toBe(parts); // setTimeout has been called as the number of parts
        done();
      });
    })
  });

  describe('Logger', function () {
    it('mocked GET', function (done) {
      request.get('https://domain.example/666').end(function (err, result) {
        expect(!err).toBe(true);
        expect(currentLog.matcher).toBe('https://domain.example/(\\w+)');
        expect(currentLog.data).toBe(undefined);
        expect(currentLog.mocked).toBe(true);
        expect(currentLog.url).toBe('https://domain.example/666');
        expect(currentLog.method).toBe('GET');
        expect(currentLog.headers).toEqual(superagentUserAgentHeader);
        done();
      });
    });

    it('mocked PUT', function (done) {
      request.put('https://domain.example/666').end(function (err, result) {
        expect(!err).toBe(true);
        expect(currentLog.matcher).toBe('https://domain.example/(\\w+)');
        expect(currentLog.data).toBe(undefined);
        expect(currentLog.mocked).toBe(true);
        expect(currentLog.url).toBe('https://domain.example/666');
        expect(currentLog.method).toBe('PUT');
        expect(currentLog.headers).toEqual(superagentUserAgentHeader);
        done();
      });
    });

    it('mocked POST', function (done) {
      request.post('https://domain.example/666', 'foo').end(function (err, result) {
        expect(!err).toBe(true);
        expect(currentLog.matcher).toBe('https://domain.example/(\\w+)');
        expect(currentLog.data).toBe('foo');
        expect(currentLog.mocked).toBe(true);
        expect(currentLog.url).toBe('https://domain.example/666');
        expect(currentLog.method).toBe('POST');
        expect(currentLog.headers).toEqual(Object.assign({'Content-Type': 'application/x-www-form-urlencoded'}, superagentUserAgentHeader));
        done();
      });
    });

    it('mocked headers (object)', function (done) {
      request.put('https://authorized.example/')
        .set({Authorization: 'valid_token', 'x-6play': 1})
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(currentLog.matcher).toBe('https://authorized.example');
          expect(currentLog.data).toBe(undefined);
          expect(currentLog.mocked).toBe(true);
          expect(currentLog.url).toBe('https://authorized.example/');
          expect(currentLog.method).toBe('PUT');
          expect(currentLog.headers).toEqual(Object.assign({Authorization: 'valid_token', 'x-6play': 1}, superagentUserAgentHeader));
          done();
        });
    });

    it('mocked headers (values)', function (done) {
      request.put('https://authorized.example/')
        .set('Authorization', 'valid_token')
        .set('x-6play', 1)
        .end(function (err, result) {
          expect(!err).toBe(true);
          expect(currentLog.matcher).toBe('https://authorized.example');
          expect(currentLog.data).toBe(undefined);
          expect(currentLog.mocked).toBe(true);
          expect(currentLog.url).toBe('https://authorized.example/');
          expect(currentLog.method).toBe('PUT');
          expect(currentLog.headers).toEqual(Object.assign({Authorization: 'valid_token', 'x-6play': 1}, superagentUserAgentHeader));
          done();
        });
    });
  });
};
