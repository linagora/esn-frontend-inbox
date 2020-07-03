'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxAttachmentAlternativeUploaderModal', function() {
  var inboxAttachmentAlternativeUploaderModal, inboxAttachmentProviderRegistry;
  var modalOptions;

  beforeEach(function() {
    modalOptions = null;

    module('linagora.esn.unifiedinbox', function($provide) {
      $provide.value('$modal', function(options) {
        modalOptions = options;
      });
    });
  });

  beforeEach(inject(function(_inboxAttachmentAlternativeUploaderModal_, _inboxAttachmentProviderRegistry_) {
    inboxAttachmentAlternativeUploaderModal = _inboxAttachmentAlternativeUploaderModal_;
    inboxAttachmentProviderRegistry = _inboxAttachmentProviderRegistry_;
  }));

  describe('The show function', function() {
    it('should open modal with local modalData', function() {
      var files = [{ name: 'file1' }, { name: 'file2' }];
      var humanReadableMaxSizeUpload = '20MB';
      var onUpload = function() {};

      inboxAttachmentAlternativeUploaderModal.show(files, humanReadableMaxSizeUpload, onUpload);

      expect(modalOptions.locals.modalData).to.shallowDeepEqual({
        files: files,
        humanReadableMaxSizeUpload: humanReadableMaxSizeUpload,
        onUpload: onUpload
      });
    });

    it('should open modal with alert template when there is no external attachment provider', function() {
      var files = [{ name: 'file1' }, { name: 'file2' }];
      var humanReadableMaxSizeUpload = '20MB';
      var onUpload = function() {};

      inboxAttachmentAlternativeUploaderModal.show(files, humanReadableMaxSizeUpload, onUpload);

      expect(modalOptions.templateUrl).to.equal('/unifiedinbox/app/components/attachment-alternative-uploader/attachment-alternative-uploader-modal-no-uploader.html');
    });

    it('should open modal with modal template when there is at least 1 external attachment provider', function() {
      inboxAttachmentProviderRegistry.add({ type: 'Linshare' });

      var files = [{ name: 'file1' }, { name: 'file2' }];
      var humanReadableMaxSizeUpload = '20MB';
      var onUpload = function() {};

      inboxAttachmentAlternativeUploaderModal.show(files, humanReadableMaxSizeUpload, onUpload);

      expect(modalOptions.templateUrl).to.equal('/unifiedinbox/app/components/attachment-alternative-uploader/attachment-alternative-uploader-modal.html');
    });
  });
});
