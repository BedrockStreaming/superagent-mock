'use strict';

var http = require('http');

module.exports = [
  {
    pattern: 'https://domain.example/(\\w+)',
    fixtures: function () {
      return 'Fixture !';
    },
    get: function (match, data) {
      return {match: match, data: data, code: 200};
    },
    post: function (match, data) {
      return {match: match, data: data, code: 201};
    },
    put: function (match, data) {
      return {match: match, data: data, code: 201};
    }
  },
  {
    pattern: 'https://domain.params.example/list(?:[?|&]((?:limit|offset)=[0-9]+))?(?:[?|&]((?:limit|offset)=[0-9]+))?',
    fixtures: function () {
      return 'Fixture !';
    },
    get: function (match, data) {
      return {match: match, data: data};
    },
    post: function (match, data) {
      return {match: match, data: data};
    },
    put: function (match, data) {
      return {match: match, data: data};
    }
  },
  {
    pattern: 'https://domain.strict-params.example/search\\?(q=\\w+)&(page=\\d+)',
    fixtures: function () {
      return 'Fixture !';
    },
    get: function (match, data) {
      return {match: match, data: data};
    },
    post: function (match, data) {
      return {match: match, data: data};
    },
    put: function (match, data) {
      return {match: match, data: data};
    }
  },
  {
    pattern: 'https://forget.query.params$',
    fixtures: function () {
      return 'Fixture !';
    },
    get: function (match, data) {
      return {match: match, data: data};
    },
    post: function (match, data) {
      return {match: match, data: data};
    },
    put: function (match, data) {
      return {match: match, data: data};
    }
  },
  {
    pattern: 'https://match.example/(\\w+)',
    fixtures: function (match) {
      return match && match[1];
    },
    get: function (match, data) {
      return {match: match, data: data};
    },
    post: function (match, data) {
      return {match: match, data: data};
    },
    put: function (match, data) {
      return {match: match, data: data};
    }
  },
  {
    pattern: 'https://match.example/foo',
    get: function (match, data) {
      return {match: match, data: data};
    },
    post: function (match, data) {
      return {match: match, data: data};
    },
    put: function (match, data) {
      return {match: match, data: data};
    }
  },
  {
    pattern: 'https://error.example/(\\w+)',
    fixtures: function (match) {
      var code = (match || [])[1] || 404;
      var newErr = new Error(parseInt(code));
      newErr.response = http.STATUS_CODES[code];
      newErr.status = code;
      throw newErr;
    },
    get: function (match, data) {
      return {match: match, data: data};
    },
    post: function (match, data) {
      return {match: match, data: data};
    },
    put: function (match, data) {
      return {match: match, data: data};
    }
  },
  {
    pattern: 'https://validation.example',
    fixtures: function (match, params, headers) {
      var error = new Error( 422 );
      var code = (match || [])[1] || 422;
      var newErr = new Error(parseInt(code));
      newErr.response = http.STATUS_CODES[code];
      newErr.status = code;
      newErr.responseHeader = 'application/json';
      newErr.responseText = '{"password": "missing"}';
      newErr.responseBody = { password: 'missing' };
      throw newErr;
    },
    post: function (match, data) {
      return {match: match, data: data};
    }
  },
  {
    pattern: 'https://domain.send.example/(\\w+)',
    fixtures: function (match, params) {
      return 'Fixture ! - superhero:' + params.superhero;
    },
    get: function (match, data) {
      return {match: match, data: data};
    },
    post: function (match, data) {
      return {match: match, data: data};
    },
    put: function (match, data) {
      return {match: match, data: data};
    }
  },
  {
    pattern: 'https://authorized.example',
    fixtures: function (match, params, headers) {
      return 'your token: ' + headers['Authorization']
    },
    get: function (match, data) {
      return {match: match, data: data};
    },
    post: function (match, data) {
      return {match: match, data: data};
    },
    put: function (match, data) {
      return {match: match, data: data};
    }
  },
  {
    pattern: 'https://multiple-headers.example',
    fixtures: function (match, params, headers) {
      return 'X-API-Key: ' + headers['X-API-Key'] + '; Content-Type: ' + headers['Content-Type']
    },
    get: function (match, data) {
      return {match: match, data: data};
    },
    post: function (match, data) {
      return {match: match, data: data};
    },
    put: function (match, data) {
      return {match: match, data: data};
    }
  },
  {
    pattern: 'https://callback.method.example',
    fixtures: function () {
      return 'Fixture !';
    },
    callback: function (match, data) {
      return {match: match, data: data};
    }
  },
  {
    pattern: 'https://context.cancel.example/([\\w-]+)',
    fixtures: function (match, data, headers, context) {
      if (match && match[1] === 'real-call') {
        context.cancel = true;
      }
      return match && match[1];
    },
    get: function (match, data) {
      return {match: match, data: data};
    },
    post: function (match, data) {
      return {match: match, data: data};
    },
    put: function (match, data) {
      return {match: match, data: data};
    }
  },
  {
    pattern: 'https://context.delay.example/([\\w-]+)',
    fixtures: function (match, data, headers, context) {
      context.delay = 3000;
      return match && match[1];
    },
    get: function (match, data) {
      return {match: match, data: data};
    },
    post: function (match, data) {
      return {match: match, data: data};
    },
    put: function (match, data) {
      return {match: match, data: data};
    }
  },
  {
    pattern: 'https://context.progress.example/([\\w-]+)',
    fixtures: function (match, data, headers, context) {
      context.progress = { parts: parseInt(match[1]), delay: 1000 };
      return match && match[1];
    },
    get: function (match, data) {
      return {match: match, data: data};
    },
    post: function (match, data) {
      return {match: match, data: data};
    },
    put: function (match, data) {
      return {match: match, data: data};
    }
  }
];
