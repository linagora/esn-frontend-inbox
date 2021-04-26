'use strict';

angular.module('esn.inbox.libs')

  .run(function($templateCache) {
    $templateCache.put('/unifiedinbox/views/partials/quotes/original.html', require('../views/partials/quotes/original.pug'));
    $templateCache.put('/unifiedinbox/views/partials/quotes/default.html', require('../views/partials/quotes/default.pug'));
    $templateCache.put('/unifiedinbox/views/partials/quotes/defaultText.html', require('../views/partials/quotes/defaultText.pug'));
    $templateCache.put('/unifiedinbox/views/partials/quotes/forward.html', require('../views/partials/quotes/forward.pug'));
    $templateCache.put('/unifiedinbox/views/partials/quotes/forwardText.html', require('../views/partials/quotes/forwardText.pug'));
    $templateCache.put('/unifiedinbox/views/partials/quotes/editAsNew.html', require('../views/partials/quotes/editAsNew.pug'));
  });
