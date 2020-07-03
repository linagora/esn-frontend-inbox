'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The inboxAttachmentJmap service', function() {
  var $rootScope, $q;
  var inboxAttachmentJmap;
  var INBOX_ATTACHMENT_TYPE_JMAP;

  beforeEach(module('linagora.esn.unifiedinbox'));

  beforeEach(inject(function(_$rootScope_, _$q_, _inboxAttachmentJmap_, _INBOX_ATTACHMENT_TYPE_JMAP_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    inboxAttachmentJmap = _inboxAttachmentJmap_;
    INBOX_ATTACHMENT_TYPE_JMAP = _INBOX_ATTACHMENT_TYPE_JMAP_;
  }));

  describe('The upload fn', function() {
    var fileUploadService;
    var uploaderMock;

    beforeEach(inject(function(_fileUploadService_) {
      fileUploadService = _fileUploadService_;

      uploaderMock = {
        addFile: sinon.stub(),
        start: sinon.spy()
      };
      fileUploadService.get = function() {
        return uploaderMock;
      };
    }));

    it('should use fileUploadService to upload file', function() {
      var file = { name: 'Learn_JS_in_6_hours.pdf', size: 12345 };
      var attachment = {
        getFile: function() {
          return file;
        }
      };

      uploaderMock.addFile.returns({
        defer: $q.defer()
      });

      inboxAttachmentJmap.upload(attachment);

      expect(uploaderMock.addFile).to.have.been.calledWith(file);
      expect(uploaderMock.start).to.have.been.calledWith();
    });

    it('should assign blobId and url to the attachment object on success', function() {
      var file = { name: 'Learn_JS_in_6_hours.pdf', size: 12345 };
      var attachment = {
        getFile: function() {
          return file;
        }
      };
      var response = { blobId: '1212', url: 'http://files.com/3423432' };
      var defer = $q.defer();

      uploaderMock.addFile.returns({ defer: defer });

      inboxAttachmentJmap.upload(attachment);
      defer.resolve({ response: response });

      $rootScope.$digest();

      expect(attachment.blobId).to.equal(response.blobId);
      expect(attachment.url).to.equal(response.url);
    });

    it('should return promise that resolve on success', function() {
      var file = { name: 'Learn_JS_in_6_hours.pdf', size: 12345 };
      var attachment = {
        getFile: function() {
          return file;
        }
      };
      var response = { blobId: '1212' };
      var defer = $q.defer();
      var successSpy = sinon.spy();

      uploaderMock.addFile.returns({ defer: defer });

      inboxAttachmentJmap.upload(attachment).promise.then(successSpy);
      defer.resolve({ response: response });

      $rootScope.$digest();

      expect(successSpy).to.have.been.calledWith();
    });

    it('should return promise that reject on failure', function() {
      var file = { name: 'Learn_JS_in_6_hours.pdf', size: 12345 };
      var attachment = {
        getFile: function() {
          return file;
        }
      };
      var defer = $q.defer();
      var catchSpy = sinon.spy();
      var error = new Error('an_error');

      uploaderMock.addFile.returns({ defer: defer });

      inboxAttachmentJmap.upload(attachment).promise.then(null, catchSpy);
      defer.reject(error);

      $rootScope.$digest();

      expect(catchSpy).to.have.been.calledWith(error);
    });

    it('should return promise to be notified the upload progress', function() {
      var file = { name: 'Learn_JS_in_6_hours.pdf', size: 12345 };
      var attachment = {
        getFile: function() {
          return file;
        }
      };
      var defer = $q.defer();
      var notifySpy = sinon.spy();

      uploaderMock.addFile.returns({ defer: defer });

      inboxAttachmentJmap.upload(attachment).promise.then(null, null, notifySpy);

      defer.notify({ progress: 70 });
      $rootScope.$digest();
      expect(notifySpy).to.have.been.calledWith(70);

      defer.notify({ progress: 80 });
      $rootScope.$digest();
      expect(notifySpy).to.have.been.calledWith(80);
    });

    it('should return cancel function of the upload promise', function() {
      var file = { name: 'Learn_JS_in_6_hours.pdf', size: 12345 };
      var attachment = {
        getFile: function() {
          return file;
        }
      };
      var cancelSpy = sinon.spy();

      uploaderMock.addFile.returns({ defer: $q.defer(), cancel: cancelSpy });

      inboxAttachmentJmap.upload(attachment).cancel();

      expect(cancelSpy).to.have.been.calledWith();
    });
  });

  describe('The fileToAttachment fn', function() {
    var jmapDraft;

    beforeEach(inject(function(_jmapDraft_) {
      jmapDraft = _jmapDraft_;
    }));

    it('should return a JMAP attachment instance', function() {
      var file = { name: 'Learn_JS_in_6_hours.pdf', size: 12345 };
      var attachment = inboxAttachmentJmap.fileToAttachment({}, file);

      expect(attachment).to.be.an.instanceof(jmapDraft.Attachment);
      expect(attachment).to.shallowDeepEqual({
        attachmentType: INBOX_ATTACHMENT_TYPE_JMAP,
        name: file.name,
        size: file.size
      });
      expect(attachment.getFile()).to.deep.equal(file);
    });
  });
});
