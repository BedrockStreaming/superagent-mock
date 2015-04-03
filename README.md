
# superagent-mock [![Build Status](https://api.travis-ci.org/M6Web/superagent-mock.png?branch=master)](https://travis-ci.org/M6Web/superagent-mock)

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
    // regular expression of URL
    pattern: 'https://domain.example/(\\w+)/',

    // callback that returns the data
    fixtures: function () {
      return 'Data fixtures';
    },

    // `match`: result of the resolution of the regular expression
    // `data`: data returns by `fixtures` attribute
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

## Tests

To run units tests: `npm test`.

To check code style: `npm run lint`.


## Credits

Developped by the [Cytron Team](http://cytron.fr/) of [M6 Web](http://tech.m6web.fr/).   
Tested with [nodeunit](https://github.com/caolan/nodeunit).

## License

superagent-mock is licensed under the [MIT license](LICENSE).
