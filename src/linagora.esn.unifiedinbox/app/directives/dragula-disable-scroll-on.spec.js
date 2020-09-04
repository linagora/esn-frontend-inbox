'use strict';

/* global chai: false, sinon: false */

const { expect } = chai;

describe('dragulaDisableScrollOn', function() {
  var $scope, $compile, $rootScope, element, touchscreenDetectorService;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      touchscreenDetectorService = {
        hasTouchscreen: function() {
          return false;
        }
      };

      $provide.value('touchscreenDetectorService', touchscreenDetectorService);
    });
  });

  beforeEach(angular.mock.inject(function(
    _$compile_,
    _$rootScope_
  ) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  function compileDirective(html, data) {
    $scope = $rootScope.$new();
    element = angular.element(html);
    element.appendTo(document.body);

    if (data) {
      Object.keys(data).forEach(function(key) {
        element.data(key, data[key]);
      });
    }

    $compile(element)($scope);
    $scope.$digest();

    return element;
  }

  context('when dragging an element', function() {
    context('on mobile', function() {
      beforeEach(function() {
        touchscreenDetectorService.hasTouchscreen = function() {
          return true;
        };
      });

      it('should not prevent from scrolling when not dragging an item', function() {
        var evt = new Event('touchmove');

        evt.preventDefault = sinon.spy();
        compileDirective('<div dragula-disable-scroll-on="some-bag" />');

        document.dispatchEvent(evt);
        expect(evt.preventDefault).to.not.have.been.called;
      });

      it('should prevent from scrolling when dragging an item', function() {
        var evt = new Event('touchmove');

        evt.preventDefault = sinon.spy();
        compileDirective('<div dragula-disable-scroll-on="some-bag" />');

        $rootScope.$broadcast('some-bag.drag');
        $rootScope.$digest();

        document.dispatchEvent(evt);
        expect(evt.preventDefault).to.have.been.called;
      });
    });
  });
});
