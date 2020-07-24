const _ = require('lodash');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxComposerBodyEditorHtmlController', function(
      $q,
      $scope,
      $element,
      $compile,
      $filter,
      INBOX_SUMMERNOTE_OPTIONS,
      INBOX_SIGNATURE_SEPARATOR
    ) {
      var self = this,
          summernoteIsReady = false;

      self.$onChanges = $onChanges;
      self.onSummernoteInit = onSummernoteInit;
      self.onSummernoteKeydown = onSummernoteKeydown;
      self.onSummernoteBlur = onSummernoteBlur;
      self.onImageUpload = onImageUpload;
      self.summernoteOptions = INBOX_SUMMERNOTE_OPTIONS;

      /////

      function $onChanges(bindings) {
        if (bindings.identity) {
          updateIdentity(bindings.identity.currentValue, !bindings.identity.previousValue);
        }
      }

      function onSummernoteKeydown(event) {
        if ((event.metaKey || event.ctrlKey) && (event.keyCode === 10 || event.keyCode === 13)) {
          self.send();
        }
      }

      function onSummernoteInit() {
        summernoteIsReady = true;

        updateIdentity(self.identity, true);

        // Hackish way of making tab/shift+tab work between summernote and it's previous field
        // Should be fixed at the summernote level...
        $element
          .find('.note-toolbar a')
          .attr('tabindex', '-1');

        $element
          .find('.note-editable')
          .after($compile('<inbox-composer-attachments message="$ctrl.message" upload="$ctrl.upload({ $attachment: $attachment })" remove-attachment="$ctrl.removeAttachment({ $attachment: $attachment })" />')($scope));
      }

      function onSummernoteBlur() {
        // Work around to fix paste(Ctrl + v) issue on Firefox
        if ($element.find('.summernote').summernote('isEmpty')) {
          return;
        }

        self.onBodyUpdate({ $body: $element.find('.summernote').summernote('code') });
      }

      function updateIdentity(identity, initializing) {
        if (!summernoteIsReady || !identity || !initializing && self.message.isDraft) {
          return;
        }

        var editable = $element.find('.note-editable'),
            signatureElement = editable.find('> div.openpaas-signature'),
            citeElement = editable.find('> cite');

        if (identity.htmlSignature) {
          if (!signatureElement.length) {
            signatureElement = angular.element('<div class="openpaas-signature"></div>');

            if (citeElement.length) {
              signatureElement.insertBefore(citeElement.get(0));
            } else {
              signatureElement.appendTo(editable);
            }
          }

          signatureElement.html(INBOX_SIGNATURE_SEPARATOR + $filter('sanitizeStylisedHtml')(identity.htmlSignature));

          self.onBodyUpdate({ $body: $element.find('.summernote').summernote('code') });
        } else {
          signatureElement.remove();
        }
      }

      function onImageUpload(files) {
        var promises = [];
        var attachments = {
          images: [],
          other: []
        };

        for (var i = files.length; i-- > 0;) {
          (/image\/*./.test(files.item(i).type)) ?
            attachments.images.push(files.item(i)) :
            attachments.other.push(files.item(i));
        }

        // Insert images
        promises = promises.concat(attachments.images.map(function(image) {
          var summernoteInsertionCallback = function(base64Url) {
            $scope.editor.summernote('insertImage', base64Url);
          };

          return fileReaderAsPromise(image).then(summernoteInsertionCallback);
        }));

        if (typeof self.onAttachmentsUpload === 'function') {
          // Enclose attachments
          if (attachments.other.length) {
            var promise = self.onAttachmentsUpload({attachments: attachments.other}).catch(function() {
              // Handle error ?
            });

            promises.push(promise);
          }
        }

        function fileReaderAsPromise(image) {
          return $q(function(resolve, reject) {
            var fr = new FileReader();

            fr.onload = function() { resolve(fr.result); };
            fr.onerror = reject;
            fr.readAsDataURL(image);
          });
        }

        return $q.all(promises);
      }
    });
})(angular);
