require('../../services.js');
require('../../../../esn.inbox.libs/app/services/jmap-client-wrapper/jmap-client-wrapper.service.js');
require('../../services/attachment-jmap/attachment-jmap.constants.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .factory('inboxAttachmentJmap', inboxAttachmentJmap);

  function inboxAttachmentJmap(
    $q,
    jmapDraft,
    fileUploadService,
    attachmentUploadService,
    DEFAULT_FILE_TYPE,
    INBOX_ATTACHMENT_TYPE_JMAP
  ) {
    return {
      type: INBOX_ATTACHMENT_TYPE_JMAP,
      icon: null,
      upload: upload,
      fileToAttachment: fileToAttachment
    };

    function upload(attachment) {
      var deferred = $q.defer();
      var uploader = fileUploadService.get(attachmentUploadService);
      var uploadTask = uploader.addFile(attachment.getFile()); // Do not start the upload immediately

      uploadTask.defer.promise.then(function(task) {
        attachment.blobId = task.response.blobId;
        attachment.url = task.response.url;
        deferred.resolve();
      }, deferred.reject, function(uploadTask) {
        deferred.notify(uploadTask.progress);
      });

      uploader.start(); // Start transferring data

      return {
        cancel: uploadTask.cancel,
        promise: deferred.promise
      };
    }

    function fileToAttachment(client, file) {
      var attachment = new jmapDraft.Attachment(client, '', {
        name: file.name,
        size: file.size,
        type: file.type || DEFAULT_FILE_TYPE
      });

      attachment.attachmentType = INBOX_ATTACHMENT_TYPE_JMAP;

      attachment.getFile = function() {
        return file;
      };

      return attachment;
    }
  }
})(angular);
