'use strict';

/* global chai: false */

var expect = chai.expect;

describe.skip('The inboxComposerBoxed directive', function() {

  var $compile, $rootScope, $timeout, element;

  function compileComponent() {
    element = angular.element(
      '<inbox-composer inbox-composer-boxed message="message" template="composer-desktop.html" />'
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

  beforeEach(angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
    $provide.value('inboxIdentitiesService', {
      getAllIdentities: function() {
        return $q.when([]);
      }
    });
  }));

  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_, _$timeout_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
  }));

  beforeEach(function() {
    $rootScope.message = {};
  });

  describe('The focusOnRightField function', function() {

    it('should focus on To field when email is empty', function() {
      compileComponent();

      expect(document.activeElement).to.equal(element.find('.recipients-to input').get(0));
    });

    it('should focus on To field when To field is empty', function() {
      $rootScope.message = {
        to: []
      };
      compileComponent();

      expect(document.activeElement).to.equal(element.find('.recipients-to input').get(0));
    });

    it('should focus on note editing field when To field is not empty', function() {
      $rootScope.message = {
        to: [{email: 'SOMEONE', name: 'SOMEONE'}]
      };
      compileComponent();

      expect(document.activeElement).to.equal(element.find('.note-editable').get(0));
    });
  });

  describe('refocusing when notified to (e.g. from box-overlay)', function() {

    var ESN_BOX_OVERLAY_EVENTS;

    beforeEach(angular.mock.inject(function(_ESN_BOX_OVERLAY_EVENTS_) {
      ESN_BOX_OVERLAY_EVENTS = _ESN_BOX_OVERLAY_EVENTS_;
    }));

    it('should keep focus on same field when resized', function() {
      compileComponent();

      element.find('.compose-subject').focus();

      $rootScope.$broadcast(ESN_BOX_OVERLAY_EVENTS.RESIZED);

      expect(document.activeElement).to.equal(element.find('.compose-subject')[0]);
    });
  });

});
