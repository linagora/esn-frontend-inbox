'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The inboxAttachmentAlternativeUploaderModalController controller', function() {
  var $controller;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(function() {
    angular.mock.inject(function(_$controller_) {
      $controller = _$controller_;
    });
  });

  function initController(modalData) {
    return $controller('inboxAttachmentAlternativeUploaderModalController', {
      modalData: modalData
    });
  }

  describe('The $onInit fn', function() {
    it('should extract properties from modalData', function() {
      var modalData = {
        files: [{ name: 'name', size: 1234 }],
        humanReadableMaxSizeUpload: '20MB',
        externalAttachmentProviders: [{ name: 'Linshare' }, { name: 'Gdrive' }]
      };
      var controller = initController(modalData);

      controller.$onInit();

      expect(controller.files).to.deep.equal(modalData.files);
      expect(controller.humanReadableMaxSizeUpload).to.deep.equal(modalData.humanReadableMaxSizeUpload);
      expect(controller.externalAttachmentProviders).to.deep.equal(modalData.externalAttachmentProviders);
      expect(controller.showProviderSelection).to.equal(true);
      expect(controller.selectedProvider).to.deep.equal(modalData.externalAttachmentProviders[0]);
    });
  });

  describe('The upload fn', function() {
    it('should call onUpload callback with all files and the selected provider', function() {
      var modalData = {
        onUpload: sinon.spy()
      };
      var controller = initController(modalData);

      controller.files = [{
        name: 'file1',
        getFile: function() {
          return 'file1';
        }
      }, {
        name: 'file2',
        getFile: function() {
          return 'file2';
        }
      }];
      controller.selectedProvider = { name: 'Linshare' };

      controller.upload();

      expect(modalData.onUpload).to.have.been.calledWith(controller.selectedProvider, ['file1', 'file2']);
    });
  });
});
