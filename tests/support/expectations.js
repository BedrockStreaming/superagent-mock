'use strict';

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
      }
    }

  };
};
