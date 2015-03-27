'use strict';

module.exports = [
  {
    pattern: 'https://domain.example/(\\w+)',
    fixtures: function () {
      return 'Fixture !';
    },
    callback: function (match, data) {
      return {match: match, data: data};
    }
  },
  {
    pattern: 'https://domain.params.example/list(?:[?|&]((?:limit|offset)=[0-9]+))?(?:[?|&]((?:limit|offset)=[0-9]+))?',
    fixtures: function () {
      return 'Fixture !';
    },
    callback: function (match, data) {
      return {match: match, data: data};
    }
  }];
