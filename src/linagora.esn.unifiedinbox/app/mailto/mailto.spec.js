'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The mailto Angular application', function() {

  beforeEach(function() {
    module('linagora.esn.unifiedinbox.mailto');
  });

  it('should create a user session', function(done) {
    module(function($provide) {
      $provide.value('sessionFactory', {
        fetchUser: function() {
          done();
        }
      });
    });

    inject();
  });

  it('should open a composer, delegating URL parsing to inboxMailtoParser', function() {
    var message = {
      to: [{
        name: 'name',
        email: 'email'
      }]
    };

    module(function($provide) {
      $provide.decorator('$location', function($delegate) {
        $delegate.search = function() {
          return {
            uri: 'mailto:testing@linagora.com'
          };
        };

        return $delegate;
      });
      $provide.value('inboxMailtoParser', function(url) {
        expect(url).to.equal('mailto:testing@linagora.com');

        return message;
      });
      $provide.value('newComposerService', { open: sinon.spy() });
      $provide.value('sessionFactory', {
        fetchUser: function(callback) {
          callback();
        }
      });
    });

    inject(function(newComposerService, BoxOverlayStateManager) {
      expect(newComposerService.open).to.have.been.calledWith(message, {
        closeable: false,
        allowedStates: [],
        initialState: BoxOverlayStateManager.STATES.FULL_SCREEN,
        onSend: sinon.match.func
      });
    });
  });

  it('should automatically close the window when the message is sent', function() {
    var message = {};

    module(function($provide) {
      $provide.decorator('$window', function($delegate) {
        $delegate.close = sinon.spy();

        return $delegate;
      });
      $provide.value('inboxMailtoParser', function() { return message; });
      $provide.value('newComposerService', {
        open: function(message, boxOptions) {
          boxOptions.onSend();
        }
      });
      $provide.value('sessionFactory', {
        fetchUser: function(callback) {
          callback();
        }
      });
    });

    inject(function($timeout, $window) {
      $timeout.flush();

      expect($window.close).to.have.been.calledWith();
    });
  });

});
