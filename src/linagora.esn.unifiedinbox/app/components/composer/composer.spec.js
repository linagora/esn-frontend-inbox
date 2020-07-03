'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The inboxComposer component', function() {

  var $compile, $rootScope, $timeout, element;

  function compileComponent() {
    element = angular.element(
      '<inbox-composer message="message" template="composer-desktop.html" on-title-update="onTitleUpdate($title)" />'
    );
    element.appendTo(document.body);

    $compile(element)($rootScope.$new());
    $timeout.flush();

    return element;
  }

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  beforeEach(module('jadeTemplates', 'linagora.esn.unifiedinbox', function($provide) {
    $provide.value('inboxIdentitiesService', {
      getAllIdentities: function() {
        return $q.when([]);
      }
    });
  }));

  beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
  }));

  beforeEach(function() {
    $rootScope.message = {};
    $rootScope.onTitleUpdate = sinon.spy();
  });

  describe('The subject field', function() {

    it.skip('should call onTitleUpdate when subject changes', function() {
      compileComponent();

      element.find('.compose-subject').val('a new title').trigger('change');

      expect($rootScope.onTitleUpdate).to.have.been.calledWith('a new title');
    });
  });

});
