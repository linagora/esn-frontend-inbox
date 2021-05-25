'use strict';

const jamesApi = require('esn-api-client/src/api/james');

angular.module('linagora.esn.james')
  .factory('jamesApiClient', jamesApiClient);

function jamesApiClient(esnApiClient) {
  return jamesApi.default(esnApiClient);
}
