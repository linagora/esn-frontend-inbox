'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxIdentities component', function() {

  var $compile, $rootScope, $scope, element;

  function compileDirective(html) {
    element = angular.element(html);

    $compile(element)($scope = $rootScope.$new());
    $scope.$digest();

    return element;
  }

  beforeEach(function() {
    module('jadeTemplates');
    module('linagora.esn.unifiedinbox', function($provide) {
      $provide.value('inboxIdentitiesService', {
        getAllIdentities: function() {
          return $q.when([{ uuid: 'default' }, { uuid: 'customIdentity1 '}]); // Two identities
        },
        getIdentity: function(uuid) {
          return $q.when({ uuid: uuid });
        },
        canEditIdentities: function() {
          return $q.when(true);
        }
      });
    });
  });

  beforeEach(inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  it('should add one child element per user identity', function() {
    compileDirective('<inbox-identities user="{}" />');

    expect(element.find('inbox-identity')).to.have.length(2);
  });

});
