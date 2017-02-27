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
  var superagentUserAgentHeader = isServer ? {"User-Agent": 'node-superagent/' + superagentPackage.version} : {};
  var originalSetTimeout = setTimeout;

  return {

    'setUp': function (go) {
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
      superagentMock = require('./../../lib/superagent-mock')(request, config, logger);

      go();
    },

    tearDown: function (go) {
      superagentMock.unset();
      headers = null;
      currentLog = null;
      // restore setTimeout
      Object.defineProperty(global, 'setTimeout', { value: originalSetTimeout });

      go();
    },

    'Lib': {
      'handle reset of mock': function (test) {
        superagentMock.unset();

        request.get('https://callback.method.example').end(function (err, result) {
          test.ok(!err);
          test.equal(result, 'Real call done');
          test.done();
        });
      }
    },
    'Method GET': {
      'matching simple request': function (test) {
        request.get('https://domain.example/666').end(function (err, result) {
          test.ok(!err);
          test.equal(result.match[1], '666');
          test.equal(result.data, 'Fixture !');
          test.equal(result.code, 200);
          test.done();
        });
      },

      'matching simple request with default callback': function (test) {
        request.get('https://callback.method.example').end(function (err, result) {
          test.ok(!err);
          test.equal(result.data, 'Fixture !');
          test.done();
        });
      },

      'unmatching simple request': function (test) {
        request.get('https://dummy.domain/666').end(function (err, result) {
          test.ok(!err);
          test.equal(result, 'Real call done');
          test.done();
        });
      },

      'matching parametrized request (object)': function (test) {
        request.get('https://domain.params.example/list')
          .query({limit: 10})
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('limit=10'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'matching double parametrized request (object)': function (test) {
        request.get('https://domain.params.example/list')
          .query({limit: 10, offset: 30})
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('limit=10'), -1);
            test.notEqual(result.match.indexOf('offset=30'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'matching parametrized request (string)': function (test) {
        request.get('https://domain.params.example/list')
          .query('limit=10')
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('limit=10'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'matching double parametrized request (string)': function (test) {
        request.get('https://domain.params.example/list')
          .query('limit=10&offset=40')
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('limit=10'), -1);
            test.notEqual(result.match.indexOf('offset=40'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'matching strict parametrized request (with url)': function (test) {
        request.get('https://domain.strict-params.example/search?q=word&page=1')
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('q=word'), -1);
            test.notEqual(result.match.indexOf('page=1'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'matching strict parametrized request (mixed)': function (test) {
        request.get('https://domain.strict-params.example/search?q=word')
          .query({page: 1})
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('q=word'), -1);
            test.notEqual(result.match.indexOf('page=1'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'unmatching strict parametrized request (missing parameter)': function (test) {
        request.get('https://domain.strict-params.example/search')
          .query({q: 'word'})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result, 'Real call done');
            test.done();
          });
      },

      'unmatching strict parametrized request (wrong parameter)': function (test) {
        request.get('https://domain.strict-params.example/search?q=word')
          .query({q: 'word', limit: 1})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result, 'Real call done');
            test.done();
          });
      },

      'matching parametrized request (no parameters)': function (test) {
        request.get('https://domain.params.example/list')
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'unmatching parametrized request (object)': function (test) {
        request.get('https://dummy.domain.params.example/list')
          .query({limit: 10})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result, 'Real call done');
            test.done();
          });
      },

      'passing matched patterns to fixtures': function (test) {
        var url = 'https://match.example/foo';
        request.get(url)
          .end(function (err, result) {
            test.equal(result.data, 'foo');
            test.deepEqual(currentLog.warnings, ['This other pattern matches the query but was ignored: https://match.example/foo']);
            test.done();
          });
      },

      'attempt to match without query params': function (test) {
        var url = 'https://forget.query.params';
        request.get(url)
          .query({param: 'forget'})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result, 'Real call done');
            test.deepEqual(currentLog.warnings, ['This pattern was ignored because it doesn\'t matches the query params: https://forget.query.params$']);
            test.done();
          });
      },

      'catches not found error and response it': function (test) {
        request.get('https://error.example/404')
          .end(function (err, result) {
            test.notEqual(err, null);
            test.equal(err.status, 404);
            test.equal(err.response, http.STATUS_CODES[404]);
            test.ok(result.notFound);
            test.done();
          });
      },

      'catches unauthorized error and response it': function (test) {
        request.get('https://error.example/401')
          .end(function (err, result) {
            test.notEqual(err, null);
            test.equal(err.status, 401);
            test.equal(err.response, http.STATUS_CODES[401]);
            test.ok(result.unauthorized);
            test.done();
          });
      },

      'also can use "send" method': function (test) {
        request.get('https://domain.send.example/666')
          .send({superhero: "me"})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result.match[1], '666');
            test.equal(result.data, 'Fixture ! - superhero:me');
            test.done();
          });
      },

      'setting headers': function (test) {
        request.get('https://authorized.example/')
          .set({Authorization: "valid_token"})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result.data, 'your token: valid_token');
            test.done();
          });
      },

      'aborting simple request': function (test) {
        request.get('https://domain.example/666').abort();

        test.done();
      }

    },
    'Method POST': {
      'matching simple request': function (test) {
        request.post('https://domain.example/666').end(function (err, result) {
          test.ok(!err);
          test.equal(result.match[1], '666');
          test.equal(result.data, 'Fixture !');
          test.equal(result.code, 201);
          test.done();
        });
      },

      'matching simple request with default callback': function (test) {
        request.post('https://callback.method.example').end(function (err, result) {
          test.ok(!err);
          test.equal(result.data, 'Fixture !');
          test.done();
        });
      },

      'unmatching simple request': function (test) {
        request.post('https://dummy.domain/666').end(function (err, result) {
          test.ok(!err);
          test.equal(result, 'Real call done');
          test.done();
        });
      },

      'matching parametrized request (object)': function (test) {
        request.post('https://domain.params.example/list')
          .query({limit: 10})
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('limit=10'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'matching double parametrized request (object)': function (test) {
        request.post('https://domain.params.example/list')
          .query({limit: 10, offset: 30})
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('limit=10'), -1);
            test.notEqual(result.match.indexOf('offset=30'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'matching parametrized request (string)': function (test) {
        request.post('https://domain.params.example/list')
          .query('limit=10')
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('limit=10'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'matching double parametrized request (string)': function (test) {
        request.post('https://domain.params.example/list')
          .query('limit=10&offset=40')
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('limit=10'), -1);
            test.notEqual(result.match.indexOf('offset=40'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'matching strict parametrized request (with url)': function (test) {
        request.post('https://domain.strict-params.example/search?q=word&page=1')
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('q=word'), -1);
            test.notEqual(result.match.indexOf('page=1'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'matching strict parametrized request (mixed)': function (test) {
        request.post('https://domain.strict-params.example/search?q=word')
          .query({page: 1})
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('q=word'), -1);
            test.notEqual(result.match.indexOf('page=1'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'unmatching strict parametrized request (missing parameter)': function (test) {
        request.post('https://domain.strict-params.example/search')
          .query({q: 'word'})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result, 'Real call done');
            test.done();
          });
      },

      'unmatching strict parametrized request (wrong parameter)': function (test) {
        request.post('https://domain.strict-params.example/search?q=word')
          .query({q: 'word', limit: 1})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result, 'Real call done');
            test.done();
          });
      },

      'matching parametrized request (no parameters)': function (test) {
        request.post('https://domain.params.example/list')
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'unmatching parametrized request (object)': function (test) {
        request.post('https://dummy.domain.params.example/list')
          .query({limit: 10})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result, 'Real call done');
            test.done();
          });
      },

      'passing matched patterns to fixtures': function (test) {
        var url = 'https://match.example/foo';
        request.post(url)
          .end(function (err, result) {
            test.equal(result.data, 'foo');
            test.deepEqual(currentLog.warnings, ['This other pattern matches the query but was ignored: https://match.example/foo']);
            test.done();
          });
      },

      'attempt to match without query params': function (test) {
        var url = 'https://forget.query.params';
        request.post(url)
          .query({param: 'forget'})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result, 'Real call done');
            test.deepEqual(currentLog.warnings, ['This pattern was ignored because it doesn\'t matches the query params: https://forget.query.params$']);
            test.done();
          });
      },

      'catches not found error and response it': function (test) {
        request.post('https://error.example/404')
          .end(function (err, result) {
            test.notEqual(err, null);
            test.equal(err.status, 404);
            test.equal(err.response, http.STATUS_CODES[404]);
            test.ok(result.notFound)
            test.done();
          });
      },

      'catches validation error and response it': function (test) {
        request.post('https://validation.example')
          .end(function (err, result) {
            test.notEqual(err, null);
            test.equal(err.status, 422);
            test.equal(err.response, http.STATUS_CODES[422]);
            test.deepEqual(result.body, {password: 'missing'});
            test.done();
          });
      },

      'catches validation errors and sets text': function (test) {
        request.post('https://error.example/401')
          .end(function (err, result) {
            test.notEqual(err, null);
            test.equal(err.status, 401);
            test.equal(err.response, http.STATUS_CODES[401]);
            test.ok(result.unauthorized)
            test.done();
          });
      },

      'setting headers': function (test) {
        request.post('https://authorized.example/')
          .set({Authorization: "valid_token"})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result.data, 'your token: valid_token');
            test.done();
          });
      },

      'setting multiple headers': function (test) {
        request.post('https://multiple-headers.example/')
          .set('X-API-Key', 'foobar')
          .set('Content-Type', 'application/json')
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result.data, 'X-API-Key: foobar; Content-Type: application/json');
            test.done();
          });
      },

      'aborting simple request': function (test) {
        request.post('https://domain.example/666').abort();

        test.done();
      }
    },
    'Method PUT': {
      'matching simple request': function (test) {
        request.put('https://domain.example/666').end(function (err, result) {
          test.ok(!err);
          test.equal(result.match[1], '666');
          test.equal(result.data, 'Fixture !');
          test.equal(result.code, 201);
          test.done();
        });
      },

      'matching simple request with default callback': function (test) {
        request.put('https://callback.method.example').end(function (err, result) {
          test.ok(!err);
          test.equal(result.data, 'Fixture !');
          test.done();
        });
      },

      'unmatching simple request': function (test) {
        request.put('https://dummy.domain/666').end(function (err, result) {
          test.ok(!err);
          test.equal(result, 'Real call done');
          test.done();
        });
      },

      'matching parametrized request (object)': function (test) {
        request.put('https://domain.params.example/list')
          .query({limit: 10})
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('limit=10'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'matching double parametrized request (object)': function (test) {
        request.put('https://domain.params.example/list')
          .query({limit: 10, offset: 30})
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('limit=10'), -1);
            test.notEqual(result.match.indexOf('offset=30'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'matching parametrized request (string)': function (test) {
        request.put('https://domain.params.example/list')
          .query('limit=10')
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('limit=10'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'matching double parametrized request (string)': function (test) {
        request.put('https://domain.params.example/list')
          .query('limit=10&offset=40')
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('limit=10'), -1);
            test.notEqual(result.match.indexOf('offset=40'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'matching strict parametrized request (with url)': function (test) {
        request.put('https://domain.strict-params.example/search?q=word&page=1')
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('q=word'), -1);
            test.notEqual(result.match.indexOf('page=1'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'matching strict parametrized request (mixed)': function (test) {
        request.put('https://domain.strict-params.example/search?q=word')
          .query({page: 1})
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result.match.indexOf('q=word'), -1);
            test.notEqual(result.match.indexOf('page=1'), -1);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'unmatching strict parametrized request (missing parameter)': function (test) {
        request.put('https://domain.strict-params.example/search')
          .query({q: 'word'})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result, 'Real call done');
            test.done();
          });
      },

      'unmatching strict parametrized request (wrong parameter)': function (test) {
        request.put('https://domain.strict-params.example/search?q=word')
          .query({q: 'word', limit: 1})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result, 'Real call done');
            test.done();
          });
      },

      'matching parametrized request (no parameters)': function (test) {
        request.put('https://domain.params.example/list')
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result.data, 'Fixture !');
            test.done();
          });
      },

      'unmatching parametrized request (object)': function (test) {
        request.put('https://dummy.domain.params.example/list')
          .query({limit: 10})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result, 'Real call done');
            test.done();
          });
      },

      'passing matched patterns to fixtures': function (test) {
        var url = 'https://match.example/foo';
        request.put(url)
          .end(function (err, result) {
            test.equal(result.data, 'foo');
            test.deepEqual(currentLog.warnings, ['This other pattern matches the query but was ignored: https://match.example/foo']);
            test.done();
          });
      },

      'attempt to match without query params': function (test) {
        var url = 'https://forget.query.params';
        request.put(url)
          .query({param: 'forget'})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result, 'Real call done');
            test.deepEqual(currentLog.warnings, ['This pattern was ignored because it doesn\'t matches the query params: https://forget.query.params$']);
            test.done();
          });
      },

      'catches not found error and response it': function (test) {
        request.put('https://error.example/404')
          .end(function (err, result) {
            test.notEqual(err, null);
            test.equal(err.status, 404);
            test.equal(err.response, http.STATUS_CODES[404]);
            test.ok(result.notFound)
            test.done();
          });
      },

      'catches unauthorized error and response it': function (test) {
        request.put('https://error.example/401')
          .end(function (err, result) {
            test.notEqual(err, null);
            test.equal(err.status, 401);
            test.equal(err.response, http.STATUS_CODES[401]);
            test.ok(result.unauthorized)
            test.done();
          });
      },

      'aborting simple request': function (test) {
        request.put('https://domain.example/666').abort();

        test.done();
      }
    },
    'Header setting': {
      'setting mocked headers': function (test) {
        request.put('https://authorized.example/')
          .set({Authorization: "valid_token"})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result.data, 'your token: valid_token');
            test.done();
          });
      },

      'setting real headers': function (test) {
        request.put('https://dummy.example/')
          .set({real: "foo"})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result, 'Real call done');
            test.deepEqual(headers, {real: "foo"});
            test.done();
          });
      }
    },
    'end': {
      'returns request object': function (test) {
        var requestObject = request.get('https://domain.example/test')
                                   .set({header: "value"})
                                   .end(function(err, result){});

        test.equal(requestObject.url, 'https://domain.example/test');
        test.deepEqual(requestObject.header, Object.assign({header: 'value'}, superagentUserAgentHeader));
        test.done();
      },
      'is only called once': function(test) {
        var calls = 0;
        test.throws(function() {
          request.get('https://domain.example/666').end(function (err) {
            calls++;
            test.ok(!err);
            throw new Error('test');
          });
        }, Error, 'Should throw internal exception');
        test.equal(calls, 1);
        test.done();
      },
      'not calling real api if not cancelled': function (test) {
        request.put('https://context.cancel.example/mock-call')
          .end(function (err, result) {
            test.ok(!err);
            test.notEqual(result, 'Real call done');
            test.done();
          });
      },
      'calling real api when cancelled': function (test) {
        request.put('https://context.cancel.example/real-call')
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result, 'Real call done');
            test.done();
          });
      },
      'calling callback function after specified delay': function (test) {
        request.put('https://context.delay.example/test')
          .end(function (err, result) {
            test.equal(result.data, 'test'); // just to see the arguments are passed as usual
            test.equal(setTimeout.calls.length, 1); // setTimeout has been called
            test.done();
          });
      },
      'calling callback function after emitting progress events': function (test) {
        var parts = 3;
        var currentPart = 1;
        var currentRequest = request.put('https://context.progress.example/' + parts)
          .on('progress', function (e) {
            test.equal(e.total, 100);
            test.equal(e.loaded, (100 / parts) * currentPart++);
          });
        if (isServer) {
          // force creation of formData (the only case where progress is used on node)
          currentRequest = currentRequest.field('name','val');
        }
        currentRequest.end(function (err, result) {
          test.equal(result.data, parts); // just to see the arguments are passed as usual
          test.equal(setTimeout.calls.length, parts); // setTimeout has been called as the number of parts
          test.done();
        });
      }
    },
    'Logger': {
      'mocked GET': function (test) {
        request.get('https://domain.example/666').end(function (err, result) {
          test.ok(!err);
          test.equal(currentLog.matcher, 'https://domain.example/(\\w+)');
          test.equal(currentLog.data, undefined);
          test.equal(currentLog.mocked, true);
          test.equal(currentLog.url, 'https://domain.example/666');
          test.equal(currentLog.method, 'GET');
          test.deepEqual(currentLog.headers, superagentUserAgentHeader);
          test.done();
        });
      },
      'mocked PUT': function (test) {
        request.put('https://domain.example/666').end(function (err, result) {
          test.ok(!err);
          test.equal(currentLog.matcher, 'https://domain.example/(\\w+)');
          test.equal(currentLog.data, undefined);
          test.equal(currentLog.mocked, true);
          test.equal(currentLog.url, 'https://domain.example/666');
          test.equal(currentLog.method, 'PUT');
          test.deepEqual(currentLog.headers, superagentUserAgentHeader);
          test.done();
        });
      },
      'mocked POST': function (test) {
        request.post('https://domain.example/666', 'foo').end(function (err, result) {
          test.ok(!err);
          test.equal(currentLog.matcher, 'https://domain.example/(\\w+)');
          test.equal(currentLog.data, 'foo');
          test.equal(currentLog.mocked, true);
          test.equal(currentLog.url, 'https://domain.example/666');
          test.equal(currentLog.method, 'POST');
          test.deepEqual(currentLog.headers, Object.assign({'Content-Type': 'application/x-www-form-urlencoded'}, superagentUserAgentHeader));
          test.done();
        });
      },
      'mocked headers (object)': function (test) {
        request.put('https://authorized.example/')
          .set({Authorization: 'valid_token', 'x-6play': 1})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(currentLog.matcher, 'https://authorized.example');
            test.equal(currentLog.data, undefined);
            test.equal(currentLog.mocked, true);
            test.equal(currentLog.url, 'https://authorized.example/');
            test.equal(currentLog.method, 'PUT');
            test.deepEqual(currentLog.headers, Object.assign({Authorization: 'valid_token', "x-6play": 1}, superagentUserAgentHeader));
            test.done();
          });
      },
      'mocked headers (values)': function (test) {
        request.put('https://authorized.example/')
          .set('Authorization', 'valid_token')
          .set('x-6play', 1)
          .end(function (err, result) {
            test.ok(!err);
            test.equal(currentLog.matcher, 'https://authorized.example');
            test.equal(currentLog.data, undefined);
            test.equal(currentLog.mocked, true);
            test.equal(currentLog.url, 'https://authorized.example/');
            test.equal(currentLog.method, 'PUT');
            test.deepEqual(currentLog.headers, Object.assign({Authorization: 'valid_token', "x-6play": 1}, superagentUserAgentHeader));
            test.done();
          });
      }
    }
  };
};
