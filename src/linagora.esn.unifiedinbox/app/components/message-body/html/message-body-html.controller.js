'use strict';

const _ = require('lodash');

require('../../../services/new-composer/new-composer.js');

angular.module('linagora.esn.unifiedinbox')

  .controller('inboxMessageBodyHtmlController', function($timeout, $q, newComposerService) {
    var self = this;

    self.$onInit = _.partial($timeout, $onInit);
    self.mailtoCallback = mailtoCallback;
    self.loadAsyncImages = loadAsyncImages;

    function $onInit() {
      document.querySelectorAll('.inbox-message-body-html a[href^="mailto:"]').forEach(function(el) {
        var $el = angular.element(el);
        var email = $el.attr('href').replace(/^mailto:/, '');

        $el.on('click', _.partialRight(self.mailtoCallback, email));
      });

      self.loadAsyncImages();
    }

    function loadAsyncImages() {
      var getUrlFromAttachment = function(attachment) {
        return attachment ? attachment.getSignedDownloadUrl() : $q.when('broken-link');
      };

      var promises = Array.prototype.map.call(document.querySelectorAll('img[data-async-src]'), function(el) {
        var dataAsyncSrc = el.getAttribute('data-async-src');

        el.removeAttribute('data-async-src');

        if (!dataAsyncSrc.match(/^cid:/)) {
          el.src = dataAsyncSrc;

          return $q.when();
        }

        return $q
          .when(_.find(self.message.attachments, {cid: dataAsyncSrc.replace('cid:', '')}))
          .then(getUrlFromAttachment)
          .then(function(url) { el.src = url; });
      });

      return $q.all(promises);
    }

    function mailtoCallback(event, emailAddress) {
      event.preventDefault();
      event.stopPropagation();

      newComposerService.open({
        to: [
          {
            email: emailAddress,
            name: emailAddress
          }
        ]
      });
    }
  });
