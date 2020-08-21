'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The inboxComposerBodyEditorText component', function() {

  var $rootScope, $timeout, $compile, autosize, element;

  function compileComponent() {
    element = angular.element(
      '<inbox-composer-body-editor-text message="message" identity="identity" on-body-update="message.textBody = $body" />'
    );
    element.appendTo(document.body);

    $compile(element)($rootScope.$new());
    $rootScope.$digest();

    return element;
  }

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  beforeEach(angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
    function autosizeMock() {}

    autosizeMock.update = sinon.spy();

    $provide.value('autosize', autosizeMock);
    $provide.value('deviceDetector', {
      isMobile: sinon.stub().returns(true)
    });

    $provide.value('esnConfig', function(key, defaultValue) {
      return $q.when().then(function() {
        if (key === 'core.language') {
          return $q.when('en');
        } else if (key === 'core.datetime') {
          return $q.when({timeZone: 'Europe/Berlin'});
        }

        return $q.when(defaultValue);
      });
    });

    $provide.constant('ESN_DATETIME_DEFAULT_TIMEZONE', 'UTC');
  }));

  beforeEach(angular.mock.inject(function(_$compile_, _$timeout_, _$rootScope_, _autosize_) {
    $compile = _$compile_;
    $timeout = _$timeout_;
    $rootScope = _$rootScope_;

    autosize = _autosize_;
  }));

  beforeEach(function() {
    $rootScope.message = {
      quoted: {
        date: '2015-08-21T00:10:00Z',
        from: { email: 'sender@linagora.com', name: 'linagora' },
        htmlBody: 'Hello',
        textBody: 'Hello'
      }
    };
    $rootScope.identity = {};
  });

  describe('The editQuotedMail function', function() {

    function editQuotedMail() {
      element.find('.edit-quoted-mail').click();
      $timeout.flush();
    }

    it('should quote the original message, and set it as the textBody', function() {
      compileComponent();
      editQuotedMail();

      expect($rootScope.message.isQuoting).to.equal(true);
      expect($rootScope.message.textBody).to.equal('\n\n\n\u0000On August 21, 2015 2:10 AM, from sender@linagora.com:\n\n> Hello');
    });

    it('should update autosize() on the email body', function() {
      compileComponent();
      editQuotedMail();

      expect(autosize.update).to.have.been.calledWith();
    });

  });

  it('should add the identity to the body when composing from scratch', function() {
    $rootScope.identity = {
      textSignature: 'my signature'
    };

    compileComponent();

    expect(element.find('.compose-body').val()).to.equal('\n\n-- \nmy signature\n\n');
  });

  it('should add the identity to the body when composing from an existing message', function() {
    $rootScope.message.textBody = 'body';
    $rootScope.identity = {
      textSignature: 'my signature'
    };

    compileComponent();

    expect(element.find('.compose-body').val()).to.equal('body-- \nmy signature\n\n');
  });

  it('should update the identity when it changes', function() {
    compileComponent();

    $rootScope.identity = {
      textSignature: 'another signature'
    };
    $rootScope.$digest();

    expect(element.find('.compose-body').val()).to.equal('\n\n-- \nanother signature\n\n');
  });

  it('should call onBodyUpdate on change', function() {
    compileComponent();

    element.find('.compose-body').val('some other text').trigger('change');
    $rootScope.$digest();

    expect($rootScope.message.textBody).to.equal('some other text');
  });

});
