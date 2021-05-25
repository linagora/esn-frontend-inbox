'use strict';

require('./james-group-synchronizer.service.js');

angular.module('linagora.esn.james')

  .factory('jamesSynchronizerService', jamesSynchronizerService);

function jamesSynchronizerService(
  jamesGroupSynchronizer
) {
  var synchronizers = {
    group: jamesGroupSynchronizer
  };

  return {
    get: get
  };

  function get(resourceType) {
    return synchronizers[resourceType];
  }
}
