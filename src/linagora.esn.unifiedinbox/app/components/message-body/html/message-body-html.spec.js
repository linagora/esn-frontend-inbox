'use strict';

/* global chai: false, sinon: false */

const { expect } = chai;

describe('The inboxMessageBodyHtml component', function() {

  var $compile, $rootScope, $timeout, newComposerService;
  var element;

  function compile(html) {
    element = angular.element(html);
    element.appendTo(document.body);

    $compile(document.body)($rootScope);
    $rootScope.$digest();

    return element.controller('inboxMessageBodyHtml');
  }

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      $provide.value('newComposerService', { open: sinon.spy() });
      $provide.value('touchscreenDetectorService', { hasTouchscreen: function() { return false; } });
    });
  });

  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_, _$timeout_, jmapDraft, _newComposerService_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    newComposerService = _newComposerService_;
    $timeout = _$timeout_;

    $rootScope.message = new jmapDraft.Message({}, 'id', 'blobId', 'threadId', ['inbox'], {
      htmlBody: '<div>Message HTML Body</div>'
    });
  }));

  describe('$onInit', function() {
    it('should open the composer when the message contains a mailto: link', function(done) {
      $rootScope.message.htmlBody = '<div><a href="mailto:admin@open-paas.org"></a></div>';

      compile('<inbox-message-body-html message="message" />').$onInit().then(function() {
        element.find('a').trigger('click');
        expect(newComposerService.open).to.have.been.calledWith({
          to: [
            {
              email: 'admin@open-paas.org',
              name: 'admin@open-paas.org'
            }
          ]
        });
        done();
      });
      $timeout.flush();
      $timeout.verifyNoPendingTasks();
    });

    it('should lazy load images on init', function(done) {
      $rootScope.message.htmlBody = '<div><a href="mailto:admin@open-paas.org"></a></div>';
      var ctrl = compile('<inbox-message-body-html message="message" />');

      sinon.spy(ctrl, 'loadAsyncImages');

      ctrl.$onInit().then(function() {
        expect(ctrl.loadAsyncImages).to.have.been.called;
        done();
      });
      $timeout.flush();
      $timeout.verifyNoPendingTasks();
    });
  });

  describe('loadAsyncImages', function() {
    it('should load images that are not in attachments', function(done) {
      $rootScope.message.htmlBody = '<img id="one" src="remote.png" /><img src="cid:1" />';
      var ctrl = compile('<inbox-message-body-html message="message" />');

      ctrl.$onInit().then(ctrl.loadAsyncImages).then(function() {
        expect(element.find('#one').attr('src')).to.eq('remote.png');
        done();
      });
      $timeout.flush();
      $timeout.verifyNoPendingTasks();
    });

    it('should load images that are in attachments', function(done) {
      $rootScope.message.htmlBody = '<img src="remote.png" /><img id="one" src="cid:1" />';
      $rootScope.message.attachments = [{
        cid: '1',
        getSignedDownloadUrl: function() { return $q.when('signed-url'); }
      }];

      var ctrl = compile('<inbox-message-body-html message="message" />');

      ctrl.$onInit().then(ctrl.loadAsyncImages).then(function() {
        expect(element.find('#one').attr('src')).to.eq('signed-url');
        done();
      });
      $timeout.flush();
      $timeout.verifyNoPendingTasks();
    });

    it('should display a broken link image for images that could not be found in attachements', function(done) {
      $rootScope.message.htmlBody = '<img src="remote.png" /><img id="one" src="cid:1" />';

      var ctrl = compile('<inbox-message-body-html message="message" />');

      ctrl.$onInit().then(ctrl.loadAsyncImages).then(function() {
        expect(element.find('#one').attr('src')).to.eq('broken-link');
        done();
      });
      $timeout.flush();
      $timeout.verifyNoPendingTasks();
    });
  });
});
