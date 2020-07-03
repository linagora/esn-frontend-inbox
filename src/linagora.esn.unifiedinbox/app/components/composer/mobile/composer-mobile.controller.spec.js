'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The inboxComposerMobileController controller', function() {

  var $componentController, newComposerService, esnPreviousPage, ctrl;

  beforeEach(module('jadeTemplates', 'linagora.esn.unifiedinbox', function($provide) {
    $provide.value('esnPreviousPage', {
      back: sinon.spy()
    });
    $provide.value('newComposerService', {
      open: sinon.spy()
    });
    $provide.value('$stateParams', {
      email: {
        id: 'myMessage'
      }
    });
  }));

  beforeEach(inject(function(_$componentController_, _newComposerService_, _esnPreviousPage_) {
    $componentController = _$componentController_;

    newComposerService = _newComposerService_;
    esnPreviousPage = _esnPreviousPage_;
  }));

  beforeEach(function() {
    ctrl = $componentController('inboxComposerMobile', {});
  });

  describe('The $onInit function', function() {

    it('should initialize ctrl.message from a state parameter', function() {
      ctrl.$onInit();

      expect(ctrl.message).to.deep.equal({
        id: 'myMessage'
      });
    });

  });

  describe('The show function', function() {

    it('should open a composer using newComposerService', function() {
      ctrl.$onInit();
      ctrl.show();

      expect(newComposerService.open).to.have.been.calledWith({
        id: 'myMessage'
      });
    });

  });

  describe('The hide function', function() {

    it('should delegate to esnPreviousPage', function() {
      ctrl.$onInit();
      ctrl.hide();

      expect(esnPreviousPage.back).to.have.been.calledWith('unifiedinbox');
    });

  });

});
