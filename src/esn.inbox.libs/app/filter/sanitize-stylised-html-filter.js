const _ = require('lodash');

(function(angular) {
  'use strict';

  /* global sanitizeHtml: false */
  angular.module('esn.inbox.libs').filter('sanitizeStylisedHtml', function($sce) {
    return function(dirty) {
      // sanitize-html's default options are available here: https://www.npmjs.com/package/sanitize-html#what-are-the-default-options
      return $sce.trustAsHtml(sanitizeHtml(dirty, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'span', 'u', 'font']),
        allowedAttributes: _.extend(sanitizeHtml.defaults.allowedAttributes, {
          '*': ['style'],
          font: ['color', 'size', 'face'],
          img: sanitizeHtml.defaults.allowedAttributes.img.concat(['width', 'height']),
          a: sanitizeHtml.defaults.allowedAttributes.a.concat(['href'])
        }),
        selfClosing: ['img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'],
        allowedSchemesByTag: {img: sanitizeHtml.defaults.allowedSchemes.concat(['data'])}
      }));
    };
  });

})(angular);

