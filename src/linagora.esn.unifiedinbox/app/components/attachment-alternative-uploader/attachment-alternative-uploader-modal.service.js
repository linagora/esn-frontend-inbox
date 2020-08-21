'use strict';

require('../../services/attachment-provider-registry/attachment-provider-registry.service.js');

angular.module('linagora.esn.unifiedinbox')
  .factory('inboxAttachmentAlternativeUploaderModal', inboxAttachmentAlternativeUploaderModal);

var MODAL_TEMPLATE = '/unifiedinbox/app/components/attachment-alternative-uploader/attachment-alternative-uploader-modal.html';
var ALERT_TEMPLATE = '/unifiedinbox/app/components/attachment-alternative-uploader/attachment-alternative-uploader-modal-no-uploader.html';

function inboxAttachmentAlternativeUploaderModal(
  $modal,
  inboxAttachmentProviderRegistry,
  INBOX_ATTACHMENT_TYPE_JMAP
) {
  return {
    show: show
  };

  function show(files, humanReadableMaxSizeUpload, onUpload, onCancel) {
    var attachmentProviders = inboxAttachmentProviderRegistry.getAll();
    var externalAttachmentProviders = Object.keys(attachmentProviders)
      .filter(function(type) {
        return type !== INBOX_ATTACHMENT_TYPE_JMAP;
      })
      .map(function(type) {
        return attachmentProviders[type];
      });

    var templateUrl = Object.keys(externalAttachmentProviders).length > 0 ? MODAL_TEMPLATE : ALERT_TEMPLATE;

    var modalData = {
      files: files.map(function(file) {
        return {
          name: file.name,
          size: file.size,
          getFile: function() { // because binding file object causes TypeError Illegal invocation
            return file;
          }
        };
      }),
      humanReadableMaxSizeUpload: humanReadableMaxSizeUpload,
      externalAttachmentProviders: externalAttachmentProviders,
      onUpload: onUpload,
      onCancel: onCancel
    };

    $modal({
      templateUrl: templateUrl,
      container: 'body',
      backdrop: 'static',
      placement: 'center',
      controller: 'inboxAttachmentAlternativeUploaderModalController',
      controllerAs: '$ctrl',
      locals: {
        modalData: modalData
      }
    });
  }
}
