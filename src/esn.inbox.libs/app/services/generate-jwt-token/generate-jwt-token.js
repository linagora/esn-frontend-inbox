'use strict';

const _ = require('lodash');

angular.module('esn.inbox.libs')
  .factory('generateJwtToken', function(esnRestangular) {
    return function() {
      return esnRestangular.one('/jwt').post('generate').then(_.property('data'));
    };
  });
