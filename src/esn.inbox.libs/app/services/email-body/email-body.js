'use strict';

angular.module('esn.inbox.libs')

  .factory('emailBodyService', function($interpolate, $templateRequest, deviceDetector, esnI18nService) {
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
      return angular.element('<div />').html(html.replace(/(<br\/>|<br>)/g, '\n')).text();
    }

    function interpolate(email, template) {
      return $interpolate(template)({
        email,
        marker: '\x00',
        toPrefix: `${esnI18nService.translate('To')}: `,
        ccPrefix: `${esnI18nService.translate('Cc')}: `
      });
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
