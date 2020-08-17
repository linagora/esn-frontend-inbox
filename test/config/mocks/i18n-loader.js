'use strict';

angular.module('esn.i18n')
  .factory('esnI18nLoader', esnI18nLoader);

function esnI18nLoader($q) {
  let getCatalogsPromise;

  return function(options) {
    getCatalogsPromise = getCatalogsPromise || getCatalogs();

    return getCatalogsPromise
      .then(function(catalogs) {
        if (!catalogs[options.key]) {
          return $q.reject(Error('No catalog found for ' + options.key));
        }

        return catalogs[options.key];
      });
  };

  function getCatalogs() {
    return $q.when({});
  }
}
