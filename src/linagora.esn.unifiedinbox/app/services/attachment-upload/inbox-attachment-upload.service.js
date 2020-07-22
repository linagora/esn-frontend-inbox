const _ = require('lodash');
require('../attachment-provider-registry/attachment-provider-registry.service.js');
require('../../services/config/config.js');
require('../../services/with-jmap-client/with-jmap-client.js');
require('../../components/attachment-alternative-uploader/attachment-alternative-uploader-modal.service.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .factory('inboxAttachmentUploadService', inboxAttachmentUploadService);

  function inboxAttachmentUploadService(
    $q,
    $filter,
    inboxAttachmentProviderRegistry,
    inboxConfig,
    withJmapClient,
    inboxAttachmentAlternativeUploaderModal,
    DEFAULT_MAX_SIZE_UPLOAD
  ) {

    return getInboxAttachmentUploadServiceInstance();

    function getInboxAttachmentUploadServiceInstance() {
      function InboxAttachmentUploadServiceInstance() {
        this.uploadAttachments = uploadAttachments.bind(this);
        this._uploadLargeFiles = _uploadLargeFiles.bind(this);
        this._upload = _upload.bind(this);
      }

      InboxAttachmentUploadServiceInstance.prototype.constructor = InboxAttachmentUploadServiceInstance;

      return new InboxAttachmentUploadServiceInstance();
    }

    function uploadAttachments(files, uploadCallback) {
      if (!files || files.length === 0) {
        return $q.resolve([]);
      }

      var self = this;

      uploadCallback = (typeof uploadCallback === 'function') ? uploadCallback : angular.noop;

      return withJmapClient(function(client) {
        return inboxConfig('maxSizeUpload', DEFAULT_MAX_SIZE_UPLOAD)
          .then(function(maxSizeUpload) {
            var largeFiles = [];
            var uploadedFiles = [];
            var humanReadableMaxSizeUpload = $filter('bytes')(maxSizeUpload);

            files.forEach(function(file) {
              if (file.size > maxSizeUpload) {
                return largeFiles.push(file);
              }

              // default attachment requires JMAP client instance
              var attachment = inboxAttachmentProviderRegistry.getDefault().fileToAttachment(client, file);

              self._upload(attachment).then(uploadCallback);

              return uploadedFiles.push(attachment);
            });

            var uploadedLargeFiles = largeFiles.length > 0 ?
              self._uploadLargeFiles(largeFiles, humanReadableMaxSizeUpload, uploadCallback) :
              $q.when([]);

            return $q.all([
              $q.when(uploadedFiles),
              uploadedLargeFiles
            ]);
          })
          .then(function(promises) {
            return _.union(promises[0], promises[1]);
          });
      });
    }

    function _uploadLargeFiles(files, humanReadableMaxSizeUpload, uploadCallback) {
      var self = this;

      return $q(function(resolve) {
        inboxAttachmentAlternativeUploaderModal.show(files, humanReadableMaxSizeUpload, onUpload, onCancel);

        function onUpload(attachmentProvider, selectedFiles) {
          resolve(selectedFiles && selectedFiles.map(function(file) {
            var attachment = attachmentProvider.fileToAttachment(file);

            self._upload(attachment).then(uploadCallback);

            return attachment;
          }));
        }

        function onCancel() {
          resolve([]);
        }
      });
    }

    function _upload(attachment) {
      attachment.status = 'uploading';
      attachment.upload = {
        progress: 0
      };

      var attachmentProvider = inboxAttachmentProviderRegistry.get(attachment.attachmentType);
      var uploader = attachmentProvider && attachmentProvider.upload;

      if (uploader) {
        var uploadTask = uploader(attachment);

        attachment.upload.cancel = uploadTask.cancel;
        attachment.upload.promise = uploadTask.promise.then(function() {
          attachment.status = 'uploaded';
        }, function(error) {
          attachmentProvider.handleErrorOnUploading && attachmentProvider.handleErrorOnUploading(error.response);
          attachment.status = 'error';
        }, function(progress) {
          attachment.upload.progress = progress;
        });
      } else {
        attachment.status = 'error';
        attachment.upload.cancel = angular.noop;
        attachment.upload.promise = $q.reject(new Error('No uploader for this attachment type: ' + attachment.attachmentType));
      }

      return attachment.upload.promise;
    }
  }

})(angular);
