'use strict';

angular.module('linagora.esn.unifiedinbox')
  .controller('inboxAttachmentAlternativeUploaderModalController', inboxAttachmentAlternativeUploaderModalController);

function inboxAttachmentAlternativeUploaderModalController(
  modalData
) {
  var self = this;

  self.$onInit = $onInit;
  self.upload = upload;
  self.cancel = cancel;

  function $onInit() {
    self.files = modalData.files;
    self.humanReadableMaxSizeUpload = modalData.humanReadableMaxSizeUpload;
    self.externalAttachmentProviders = modalData.externalAttachmentProviders;
    self.showProviderSelection = self.externalAttachmentProviders.length > 1;
    self.selectedProvider = self.externalAttachmentProviders[0];
  }

  function upload() {
    // select all files for now, file selection will come in the future
    var selectedFiles = self.files.map(function(file) {
      return file.getFile();
    });

    modalData.onUpload(self.selectedProvider, selectedFiles);
  }

  function cancel() {
    modalData.onCancel && modalData.onCancel();
  }
}
