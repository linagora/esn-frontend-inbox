'use strict';

/* global chai: false */
/* global sinon: false */

const { expect } = chai;

describe('The inboxAttachmentUploadService service', function() {
  var $rootScope;
  var inboxAttachmentUploadService, inboxAttachmentProviderRegistry;
  var inboxAttachmentAlternativeUploaderModal;
  var attachmentProviderMock;
  var DEFAULT_FILE_TYPE;
  var DEFAULT_MAX_SIZE_UPLOAD;

  beforeEach(angular.mock.module('linagora.esn.unifiedinbox', 'esn.attachments-selector', function($provide) {
    $provide.value('inboxConfig', function(key, defaultValue) {
      return $q.when(defaultValue);
    });
    $provide.value('withJmapClient', function(callback) {
      return callback({});
    });
    $provide.value('inboxAttachmentAlternativeUploaderModal', {
      show: sinon.spy(function(x, y, callback) {
        callback();
      })
    });
  }));

  beforeEach(angular.mock.inject(function(
    _$rootScope_,
    _inboxAttachmentUploadService_,
    _inboxAttachmentProviderRegistry_,
    _inboxAttachmentAlternativeUploaderModal_,
    _DEFAULT_FILE_TYPE_,
    _DEFAULT_MAX_SIZE_UPLOAD_
  ) {
    $rootScope = _$rootScope_;
    inboxAttachmentUploadService = _inboxAttachmentUploadService_;
    inboxAttachmentProviderRegistry = _inboxAttachmentProviderRegistry_;
    inboxAttachmentAlternativeUploaderModal = _inboxAttachmentAlternativeUploaderModal_;
    DEFAULT_FILE_TYPE = _DEFAULT_FILE_TYPE_;
    DEFAULT_MAX_SIZE_UPLOAD = _DEFAULT_MAX_SIZE_UPLOAD_;
  }));

  describe('The upload service', function() {
    beforeEach(function() {
      attachmentProviderMock = {};
      inboxAttachmentProviderRegistry.get = function() {
        return attachmentProviderMock;
      };
    });

    it('should use attachment provider\'s uploader to upload attachment', function() {
      attachmentProviderMock.upload = sinon.stub().returns({
        promise: $q.defer().promise
      });

      var attachment = { attachmentType: 'jmap' };

      inboxAttachmentUploadService._upload(attachment);

      expect(attachmentProviderMock.upload).to.have.been.calledWith(attachment);
      expect(attachment.status).to.equal('uploading');
      expect(attachment.upload.progress).to.equal(0);
    });

    it('should set upload status to uploaded on promise resolved', function() {
      attachmentProviderMock.upload = function() {
        return {
          promise: $q.when()
        };
      };

      var attachment = { attachmentType: 'jmap' };

      inboxAttachmentUploadService._upload(attachment);

      $rootScope.$digest();
      expect(attachment.status).to.equal('uploaded');
    });

    it('should set upload status to error on promise rejected', function() {
      attachmentProviderMock.upload = function() {
        return {
          promise: $q.reject()
        };
      };

      var attachment = { attachmentType: 'jmap' };

      inboxAttachmentUploadService._upload(attachment);

      $rootScope.$digest();
      expect(attachment.status).to.equal('error');
    });

    it('should call handle error on promise rejected if provider can handle it', function() {
      var error = { response: 'something failed' };

      attachmentProviderMock.upload = function() {
        return {
          promise: $q.reject(error)
        };
      };

      attachmentProviderMock.handleErrorOnUploading = sinon.spy();

      var attachment = { attachmentType: 'provider' };

      inboxAttachmentUploadService._upload(attachment);
      $rootScope.$digest();

      expect(attachmentProviderMock.handleErrorOnUploading).to.have.been.calledOnce;
      expect(attachmentProviderMock.handleErrorOnUploading).to.have.been.calledWith(error.response);
    });

    it('should update the upload progress on promise notified', function() {
      var uploadDeferred = $q.defer();

      attachmentProviderMock.upload = function() {
        return {
          promise: uploadDeferred.promise
        };
      };

      var attachment = { attachmentType: 'jmap' };

      inboxAttachmentUploadService._upload(attachment);

      expect(attachment.upload.progress).to.equal(0);

      uploadDeferred.notify(50);
      $rootScope.$digest();

      expect(attachment.upload.progress).to.equal(50);
    });

    it('should set upload status error when there is no corresponding attachment provider', function() {
      attachmentProviderMock = null;

      var attachment = { attachmentType: 'jmap' };

      inboxAttachmentUploadService._upload(attachment);

      expect(attachment.status).to.equal('error');
    });
  });

  describe('The uploadAttachments function', function() {
    beforeEach(function() {
      sinon.stub(inboxAttachmentUploadService, '_upload').callsFake(function(attachments) {
        return $q.when(attachments);
      });
    });

    it('should do nothing if no files are given', function(done) {
      inboxAttachmentUploadService.uploadAttachments().then(function(attachments) {
        expect(attachments).to.deep.equal([]);
        expect(inboxAttachmentUploadService._upload).to.have.not.been.called;

        done();
      });

      $rootScope.$digest();
    });

    it('should do nothing if files is zerolength', function(done) {
      inboxAttachmentUploadService.uploadAttachments([]).then(function(attachments) {
        expect(attachments).to.deep.equal([]);
        expect(inboxAttachmentUploadService._upload).to.have.not.been.called;

        done();
      });

      $rootScope.$digest();
    });

    it('should add the attachment, with a default file type, upload it and notify caller of the change', function(done) {
      var expectedAttachment = {
        name: 'name',
        size: 1,
        type: DEFAULT_FILE_TYPE
      };

      inboxAttachmentUploadService.uploadAttachments([{ name: 'name', size: 1 }]).then(function(attachments) {
        expect(attachments[0]).to.shallowDeepEqual(expectedAttachment);
        expect(inboxAttachmentUploadService._upload).to.have.been.calledWith(sinon.match({ name: 'name' }));

        done();
      });

      $rootScope.$digest();
    });

    it('should add the attachment if the file size is exactly the limit', function(done) {
      inboxAttachmentUploadService.uploadAttachments([{
        name: 'name',
        size: DEFAULT_MAX_SIZE_UPLOAD
      }]).then(function(attachments) {
        expect(attachments).to.have.length(1);

        done();
      });

      $rootScope.$digest();
    });

    describe('on file larger than the limit', function() {

      it('should show alternative uploader modal and not add the attachment if there is no alternative upload provider', function(done) {
        var largeFiles = [
          { name: 'name1', size: DEFAULT_MAX_SIZE_UPLOAD + 1 },
          { name: 'name2', size: DEFAULT_MAX_SIZE_UPLOAD + 2 }
        ];

        inboxAttachmentUploadService.uploadAttachments(largeFiles).then(function(attachments) {
          expect(inboxAttachmentAlternativeUploaderModal.show).to.have.been.calledWith(largeFiles, '20MB', sinon.match.func);
          expect(attachments).to.deep.equal([]);

          done();
        });

        $rootScope.$digest();
      });

      it('should show alternative uploader modal and add the attachment if there is alternative upload provider', function(done) {
        var largeFiles = [{ name: 'name1', size: DEFAULT_MAX_SIZE_UPLOAD + 1 }];

        inboxAttachmentAlternativeUploaderModal.show = function(files, maxSizeUpload, onUpload) {
          onUpload({
            fileToAttachment: function(file) {
              return { name: file.name, size: file.size };
            }
          }, files);
        };

        inboxAttachmentUploadService.uploadAttachments(largeFiles).then(function(attachments) {
          expect(attachments).to.deep.equal(largeFiles);
          expect(inboxAttachmentUploadService._upload).to.have.been.calledWith(sinon.match({ name: 'name1' }));
          done();
        });

        $rootScope.$digest();
      });
    });
  });
});
