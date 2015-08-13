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
    pattern: 'https://domain.example/(\\w+)/',

    /**
     * returns the data
     *
     * @param match array Result of the resolution of the regular expression
     * @param params object sent by 'send' function
     */
    fixtures: function (match, params) {
      /**
       * example:
       *   request.get('https://error.example/404').end(function(err, res){
       *     console.log(err); // 404
       *   })
       */
      if (match[1] === '404') {
        throw new Error(404);
      }

      /**
       * example:
       *   request.get('https://error.example/200').end(function(err, res){
       *     console.log(res.body); // "Data fixtures"
       *   })
       */

      /**
       * example:
       *   request.get('https://domain.send.example/').send({superhero: "me"}).end(function(err, res){
       *     console.log(res.body); // "Data fixtures - superhero:me"
       *   })
       */
      if(params["superhero"]) {
        return 'Data fixtures - superhero:' + params["superhero"];
      } else {
        return 'Data fixtures';
      }
    },

    /**
     * returns the result of the request
     *
     * @param match array Result of the resolution of the regular expression
     * @param data  mixed Data returns by `fixtures` attribute
     */
    callback: function (match, data) {
      return {
        body: data
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

require('superagent-mock')(request, config);
```

## Supported Methods

All methods are supported.

## Tests

To run units tests: `npm test`.

To check code style: `npm run lint`.


## Credits

Developped by the [Cytron Team](http://cytron.fr/) of [M6 Web](http://tech.m6web.fr/).
Tested with [nodeunit](https://github.com/caolan/nodeunit).

## License

superagent-mock is licensed under the [MIT license](LICENSE).
