(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .directive('inboxComposerBoxed', function($timeout, ESN_BOX_OVERLAY_EVENTS) {
      return {
        restrict: 'A',
        require: 'inboxComposer',
        link: function(scope, element, attrs, composer) {
          focusRightField();
          startTrackingFocus();

          scope.$on(ESN_BOX_OVERLAY_EVENTS.RESIZED, focusOnResize);

          /////

          function focusRightField() {
            $timeout(function() {
              if (!composer.message || !composer.message.to || composer.message.to.length === 0) {
                element.find('.recipients-to input').focus();
              } else {
                element.find('.summernote').summernote('focus');
              }
            }, 0);
          }

          function focusOnResize() {
            if (scope.lastFocused && scope.lastFocused.node) {
              if (!!scope.lastFocused.isFoldable && scope.isCollapsed) {
                scope.isCollapsed = false;
              }

              $timeout(function() {
                scope.lastFocused.node.focus();
              }, 350);
            }
          }

          function isRecipient(inputElement) {
            return angular.element(inputElement).closest('recipients-auto-complete').length > 0;
          }

          function handleFocusEvent(event) {
            scope.lastFocused = {
              node: event.target,
              isFoldable: isRecipient(event.target) && !scope.isCollapsed
            };
          }

          function startTrackingFocus() {
            element.context.children[0].addEventListener('focusin', handleFocusEvent, true);
          }
        }
      };
    });

})(angular);
