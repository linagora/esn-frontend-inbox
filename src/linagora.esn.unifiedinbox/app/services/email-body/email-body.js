(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('emailBodyService', function($interpolate, $templateRequest, deviceDetector) {
      return {
        bodyProperty: supportsRichtext() ? 'htmlBody' : 'textBody',
        quote: quote,
        quoteOriginalEmail: quoteOriginalEmail,
        supportsRichtext: supportsRichtext
      };

      /////

      function quote(email, templateName, forceRichTextTemplate) {
        if (!templateName) {
          templateName = 'default';
        }

        return _quote(email, '/unifiedinbox/views/partials/quotes/' + templateName + (forceRichTextTemplate || supportsRichtext() ? '.html' : 'Text.html'), (forceRichTextTemplate || supportsRichtext()));
      }

      function quoteOriginalEmail(email) {
        return _quote(email, '/unifiedinbox/views/partials/quotes/original.html', true);
      }

      function htmlToText(html) {
        return angular.element('<div />').html(html.replace(/<br\/>/g, '\n')).text();
      }

      function interpolate(email, template) {
        return $interpolate(template)({ email: email, marker: '\x00' });
      }

      function _quote(email, template, supportRichTextTemplate) {
        return $templateRequest(template).then(function(template) {
          return interpolate(email, supportRichTextTemplate ? template : htmlToText(template));
        });
      }

      function supportsRichtext() {
        return !deviceDetector.isMobile();
      }
    });

})();
