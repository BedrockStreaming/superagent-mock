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

See [this post](http://tech.m6web.fr/how-did-we-mock-the-backend-developers.html) to know why we use superagent-mock at M6Web.

## Installation

Install with [npm](http://npmjs.org/): `npm install superagent-mock`

Install with [yarn](https://yarnpkg.com/): `yarn add superagent-mock`

## Requirements

node >= 6
superagent >= ^3.6.0

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
     * @param context object the context of running the fixtures function
     */
    fixtures: function (match, params, headers, context) {
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
          return 'You didnt choose a hero';
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

      /**
       * Cancelling the mocking for a specific matched route example:
       *   request.get('https://domain.example/server_test').end(function(err, res){
       *     console.log(res.body); // (whatever the actual server would have returned)
       *   })
       */

      if (match[1] === '/server_test') {
        context.cancel = true; // This will cancel the mock process and continue as usual (unmocked)
        return null;
      }

      /**
       * Delaying the response with a specific number of milliseconds:
       *   request.get('https://domain.example/delay_test').end(function(err, res){
       *     console.log(res.body); // This log will be written after the delay time has passed 
       *   })
       */

      if (match[1] === '/delay_test') {
        context.delay = 3000; // This will delay the response by 3 seconds
        return 'zzZ';
      }

      /**
       * Mocking progress events:
       *   request.get('https://domain.example/progress_test')
       *     .on('progress', function (e) { console.log(e.percent + '%'); })
       *     .end(function(err, res){
       *       console.log(res.body); // This log will be written after all progress events emitted 
       *     })
       */

      if (match[1] === '/progress_test') {
        context.progress = {
          parts: 3,               // The number of progress events to emit one after the other with linear progress
                                  //   (Meaning, loaded will be [total/parts])
          delay: 1000,            // [optional] The delay of emitting each of the progress events by ms 
                                  //   (default is 0 unless context.delay specified, then it's [delay/parts])
          total: 100,             // [optional] The total as it will appear in the progress event (default is 100)
          lengthComputable: true, // [optional] The same as it will appear in the progress event (default is true)
          direction: 'upload'     // [optional] superagent adds 'download'/'upload' direction to the event (default is 'upload')
        };
        return 'Hundred percent!';
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
        status: 201
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

// Before tests
var superagentMock = require('superagent-mock')(request, config);

...

// After tests
superagentMock.unset();
```

## Supported methods

All request methods are supported (get, put, post, etc.).

Each request method mock have to be declared in the config file. Otherwise, the `callback` method is used.

## Logging

You can monitor each call, that has been intercepted by superagent-mock or not, by passing a callback function at initialization.

``` js
// ./server.js file
var request = require('superagent');
var config = require('./superagent-mock-config');

var logger = function(log)  {
  console.log('superagent call', log);
};

// Before tests
var superagentMock = require('superagent-mock')(request, config, logger);

...

// After tests
superagentMock.unset();
```

The callback function will be called with an object containing the following informations
 - data : data used with `superagent.send` function
 - headers : array of headers given by `superagent.set` function
 - matcher : regex matching the current url which is defined in the provided config
 - url : url which superagent was called
 - method : HTTP method used for the call
 - timestamp : timestamp of the superagent call
 - mocked : true if the call was mocked by superagent mock, false if it used superagent real methods

## Development scripts

To run units tests: `yarn test`.

To check code style: `yarn lint`.

To build code: `yarn build`.

## Credits

Developped by the [Cytron Team](http://cytron.fr/) of [M6 Web](http://tech.m6web.fr/).
Tested with [nodeunit](https://github.com/caolan/nodeunit).

## License

superagent-mock is licensed under the [MIT license](LICENSE).
