![](https://img.shields.io/badge/License-MIT-00CCFF.svg?style=flat-square)
![](https://img.shields.io/badge/superagent--mock-JS-FF0066.svg?style=flat-square)
[![NPM Downloads](http://img.shields.io/npm/dm/superagent-mock.svg?style=flat-square)](https://www.npmjs.org/package/superagent-mock)
[![Build Status](http://img.shields.io/travis/M6Web/superagent-mock.svg?style=flat-square)](https://travis-ci.org/M6Web/superagent-mock)

<p align="center">
<b><a href="#installation">Installation</a></b>
|
<b><a href="#usage">Usage</a></b>
|
<b><a href="#supported-methods">Supported Methods</a></b>
|
<b><a href="#tests">Tests</a></b>
|
<b><a href="#credits">Credits</a></b>
|
<b><a href="#license">License</a></b>
</p>

# superagent-mock

[superagent](https://github.com/visionmedia/superagent) plugin allowing to simulate HTTP calls by returning data fixtures based on the requested URL.

**Note**: this plugin is developed for `superagent: ^v1.1.0`.

See [this post](http://tech.m6web.fr/how-did-we-mock-the-backend-developers.html) to know why we use superagent-mock at M6Web.

## Installation

Install with [npm](http://npmjs.org/):

```sh
$ npm install superagent-mock
```

## Usage

First, you have to define the URLs to mock in a configuration file:

```js
// ./superagent-mock-config.js file
module.exports = [
  {
    /**
     * regular expression of URL
     */
    pattern: 'https://domain.example(.*)',

    /**
     * returns the data
     *
     * @param match array Result of the resolution of the regular expression
     * @param params object sent by 'send' function
     * @param headers object set by 'set' function
     */
    fixtures: function (match, params, headers) {
      /**
       * Returning error codes example:
       *   request.get('https://domain.example/404').end(function(err, res){
       *     console.log(err); // 404
       *     console.log(res.notFound); // true
       *   })
       */
      if (match[1] === '/404') {
        throw new Error(404);
      }

      /**
       * Checking on parameters example:
       *   request.get('https://domain.example/hero').send({superhero: "superman"}).end(function(err, res){
       *     console.log(res.body); // "Your hero: superman"
       *   })
       */

      if (match[1] === '/hero') {
        if(params['superhero']) {
          return 'Your hero:' + params['superhero'];
        } else {
          return 'You didnt chose a hero';
        }
      }


      /**
       * Checking on headers example:
       *   request.get('https://domain.example/authorized_endpoint').set({Authorization: "9382hfih1834h"}).end(function(err, res){
       *     console.log(res.body); // "Authenticated!"
       *   })
       */

      if (match[1] === '/authorized_endpoint') {
        if(headers['Authorization']) {
          return 'Authenticated!';
        } else {
          throw new Error(401); // Unauthorized
        }
      }

    },

    /**
     * returns the result of the GET request
     *
     * @param match array Result of the resolution of the regular expression
     * @param data  mixed Data returns by `fixtures` attribute
     */
    get: function (match, data) {
      return {
        body: data
      };
    },

    /**
     * returns the result of the POST request
     *
     * @param match array Result of the resolution of the regular expression
     * @param data  mixed Data returns by `fixtures` attribute
     */
    post: function (match, data) {
      return {
        code: 201
      };
    }
  },
  ...
];
```

Then use the plugin:

```js
// ./server.js file
var request = require('superagent');
var config = require('./superagent-mock-config');

//Before tests
var superagentMock = require('superagent-mock')(request, config);

...

//After tests
superagentMock.unset();
```

## Supported methods

All request methods are supported (get, put, post, etc.).

Each request method mock have to be declared in the config file. Otherwise, the `callback` method is used.

## Tests

To run units tests: `npm test`.

To check code style: `npm run lint`.


## Credits

Developped by the [Cytron Team](http://cytron.fr/) of [M6 Web](http://tech.m6web.fr/).
Tested with [nodeunit](https://github.com/caolan/nodeunit).

## License

superagent-mock is licensed under the [MIT license](LICENSE).
