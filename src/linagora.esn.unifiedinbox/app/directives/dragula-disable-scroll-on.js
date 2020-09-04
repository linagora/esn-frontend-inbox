'use strict';

angular.module('linagora.esn.unifiedinbox').directive('dragulaDisableScrollOn', function(touchscreenDetectorService) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      var scrollable = true;
      var bagName = attrs.dragulaDisableScrollOn;

      if (touchscreenDetectorService.hasTouchscreen()) {
        document.addEventListener('touchmove', listener, { passive: false });

        scope.$on(bagName + '.drag', function() {
          scrollable = false;
        });
      }

      scope.$on(bagName + '.drop-model', function() {
        scrollable = true;
      });

      scope.$on('$destroy', function() {
        document.removeEventListener('touchmove', listener);
      });

      function listener(e) {
        if (!scrollable) {
          e.preventDefault();
        }
      }
    }
  };
});
