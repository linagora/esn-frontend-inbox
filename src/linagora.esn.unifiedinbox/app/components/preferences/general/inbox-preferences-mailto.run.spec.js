'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxPreferencesMailto component', function() {

  it('should register a dynamic directive in controncenter/general if browser supports protocol handlers', function() {
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      $provide.decorator('$window', function($delegate) {
        $delegate.navigator.registerProtocolHandler = angular.noop;

        return $delegate;
      });
    });

    angular.mock.inject(function(dynamicDirectiveService) {
      expect(dynamicDirectiveService.getInjections('esn-preferences-general')).to.have.length(1);
    });
  });

  it('should rot register a dynamic directive in controncenter/general if browser does not support protocol handlers', function() {
    angular.mock.inject(function(dynamicDirectiveService) {
      expect(dynamicDirectiveService.getInjections('esn-preferences-general')).to.have.length(0);
    });
  });

});
