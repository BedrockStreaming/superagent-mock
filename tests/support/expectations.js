'use strict';

var http = require('http');

module.exports = function (request, config) {
  return {

    'setUp': function (go) {
      // Stubbing the superagent method
      request.Request.prototype.end = function (fn) {
        fn(null, 'Real call done');
      };

      // Init module
      require('./../../lib/superagent-mock')(request, config);

      go();
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
            test.done();
          });
      },

      'catches not found error and response it': function (test) {
        request.get('https://error.example/404')
          .end(function (err, result) {
            test.notEqual(err, null);
            test.equal(err.status, 404);
            test.equal(err.response, http.STATUS_CODES[404]);
            test.ok(result.notFound)
            test.done();
          });
      },

      'catches unauthorized error and response it': function (test) {
        request.get('https://error.example/401')
          .end(function (err, result) {
            test.notEqual(err, null);
            test.equal(err.status, 401);
            test.equal(err.response, http.STATUS_CODES[401]);
            test.ok(result.unauthorized)
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

      'catches unauthorized error and response it': function (test) {
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

      'setting headers': function (test) {
        request.put('https://authorized.example/')
          .set({Authorization: "valid_token"})
          .end(function (err, result) {
            test.ok(!err);
            test.equal(result.data, 'your token: valid_token');
            test.done();
          });
      }
    }
  };
};
