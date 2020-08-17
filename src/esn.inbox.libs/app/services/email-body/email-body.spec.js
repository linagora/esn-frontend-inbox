'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The emailBodyService factory', function() {

  var $rootScope, emailBodyService, isMobile;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      isMobile = false;

      $provide.value('esnConfig', function(key) {
        return $q.when().then(function() {
          if (key === 'core.language') {
            return $q.when('en');
          } else if (key === 'core.datetime') {
            return $q.when({timeZone: 'Europe/Berlin'});
          }

          return $q.when();
        });
      });

      $provide.constant('ESN_DATETIME_DEFAULT_TIMEZONE', 'UTC');
      $provide.value('deviceDetector', {
        isMobile: function() { return isMobile; }
      });
    });
  });

  beforeEach(angular.mock.inject(function(_emailBodyService_, _$rootScope_) {
    $rootScope = _$rootScope_;
    emailBodyService = _emailBodyService_;
  }));

  describe('The quote function', function() {

    var email = {
      from: {
        name: 'test',
        email: 'test@open-paas.org'
      },
      subject: 'Heya',
      date: '2015-08-21T00:10:00Z',
      textBody: 'TextBody',
      htmlBody: '<p>HtmlBody</p>'
    };

    function quotedMessage(message) {
      return {
        quoted: message
      };
    }

    it('should quote htmlBody using a richtext template if not on mobile', function(done) {
      emailBodyService.quote(quotedMessage(email))
        .then(function(text) {
          expect(text).to.equal('<p><br/></p><cite>On August 21, 2015 2:10 AM, from test@open-paas.org</cite><blockquote><p>HtmlBody</p></blockquote>');
        })
        .then(done, done);

      $rootScope.$digest();
    });

    it('should quote textBody using a richtext template if not on mobile and htmlBody is not available', function(done) {
      emailBodyService.quote(quotedMessage(_.omit(email, 'htmlBody')))
        .then(function(text) {
          expect(text).to.equal('<p><br/></p><cite>On August 21, 2015 2:10 AM, from test@open-paas.org</cite><blockquote>TextBody</blockquote>');
        })
        .then(done, done);

      $rootScope.$digest();
    });

    it('should quote textBody using a plaintext template if on mobile', function(done) {
      isMobile = true;
      emailBodyService.quote(quotedMessage(_.omit(email, 'htmlBody')), 'default', false)
        .then(function(text) {
          expect(text).to.equal('\n\n\n\u0000On August 21, 2015 2:10 AM, from test@open-paas.org:\n\n> TextBody');
        })
        .then(done, done);

      $rootScope.$digest();
    });

    it('should quote textBody using a richtext template if on mobile and asked to do so', function(done) {
      isMobile = true;
      emailBodyService.quote(quotedMessage(_.omit(email, 'htmlBody')), 'default', true)
        .then(function(text) {
          expect(text).to.equal('<p><br/></p><cite>On August 21, 2015 2:10 AM, from test@open-paas.org</cite><blockquote>TextBody</blockquote>');
        })
        .then(done, done);

      $rootScope.$digest();
    });

    it('should leverage the rich mode of forward template if specified', function(done) {
      emailBodyService.quote(quotedMessage(email), 'forward')
        .then(function(text) {
          expect(text).to.equal('<p><br/></p><cite>------- Forwarded message -------<br/>Subject: Heya<br/>Date: August 21, 2015 2:10 AM<br/>From: test@open-paas.org<br/><br/></cite><blockquote><p>HtmlBody</p></blockquote>');
        })
        .then(done, done);

      $rootScope.$digest();
    });

    it('should leverage the text mode of forward template if specified', function(done) {
      isMobile = true;
      emailBodyService.quote(quotedMessage(_.omit(email, 'htmlBody')), 'forward', false)
        .then(function(text) {
          expect(text).to.equal('\n\n\n\u0000------- Forwarded message -------\nSubject: Heya\nDate: August 21, 2015 2:10 AM\nFrom: test@open-paas.org\n\n\n\n> TextBody');
        })
        .then(done, done);

      $rootScope.$digest();
    });

    it('should quote textBody using a "forward" richtext template if on mobile and asked to do so', function(done) {
      isMobile = true;
      emailBodyService.quote(quotedMessage(_.omit(email, 'htmlBody')), 'forward', true)
        .then(function(text) {
          expect(text).to.equal('<p><br/></p><cite>------- Forwarded message -------<br/>Subject: Heya<br/>Date: August 21, 2015 2:10 AM<br/>From: test@open-paas.org<br/><br/></cite><blockquote>TextBody</blockquote>');
        })
        .then(done, done);

      $rootScope.$digest();
    });

    it('should apply nl2br to original email textBody', function(done) {
      var email = {
        from: {
          name: 'test',
          email: 'test@open-paas.org'
        },
        subject: 'Heya',
        date: '2015-08-21T00:10:00Z',
        textBody: 'Text\nBody\nTest'
      };

      emailBodyService.quote(quotedMessage(email))
        .then(function(text) {
          expect(text).to.equal('<p><br/></p><cite>On August 21, 2015 2:10 AM, from test@open-paas.org</cite><blockquote>Text<br/>Body<br/>Test</blockquote>');
        })
        .then(done, done);

      $rootScope.$digest();
    });

    it('should not apply nl2br to original email HTML body', function(done) {
      var email = {
        from: {
          name: 'test',
          email: 'test@open-paas.org'
        },
        subject: 'Heya',
        date: '2015-08-21T00:10:00Z',
        htmlBody: '<p><div>Test\nTest</div\n></p>'
      };

      emailBodyService.quote(quotedMessage(email))
        .then(function(text) {
          expect(text).to.equal('<p><br/></p><cite>On August 21, 2015 2:10 AM, from test@open-paas.org</cite><blockquote><p><div>Test\nTest</div\n></p></blockquote>');
        })
        .then(done, done);

      $rootScope.$digest();
    });

    it('should apply nl2br to original email textBody, when forwarding', function(done) {
      var email = {
        from: {
          name: 'test',
          email: 'test@open-paas.org'
        },
        subject: 'Heya',
        date: '2015-08-21T00:10:00Z',
        textBody: 'Text\nBody\nTest'
      };

      emailBodyService.quote(quotedMessage(email), 'forward')
        .then(function(text) {
          expect(text).to.equal('<p><br/></p><cite>------- Forwarded message -------<br/>Subject: Heya<br/>Date: August 21, 2015 2:10 AM<br/>From: test@open-paas.org<br/><br/></cite><blockquote>Text<br/>Body<br/>Test</blockquote>');
        })
        .then(done, done);

      $rootScope.$digest();
    });

    it('should not apply nl2br to original email HTML body, when forwarding', function(done) {
      var email = {
        from: {
          name: 'test',
          email: 'test@open-paas.org'
        },
        subject: 'Heya',
        date: '2015-08-21T00:10:00Z',
        htmlBody: '<p><div>Test\nTest</div\n></p>'
      };

      emailBodyService.quote(quotedMessage(email), 'forward')
        .then(function(text) {
          expect(text).to.equal('<p><br/></p><cite>------- Forwarded message -------<br/>Subject: Heya<br/>Date: August 21, 2015 2:10 AM<br/>From: test@open-paas.org<br/><br/></cite><blockquote><p><div>Test\nTest</div\n></p></blockquote>');
        })
        .then(done, done);

      $rootScope.$digest();
    });

  });

  describe('The supportsRichtext function', function() {

    it('is true when deviceDetector.isMobile()=false', function() {
      expect(emailBodyService.supportsRichtext()).to.equal(true);
    });

    it('is false when deviceDetector.isMobile()=true', function() {
      isMobile = true;
      expect(emailBodyService.supportsRichtext()).to.equal(false);
    });

  });

  describe('The quoteOriginalEmail function', function() {

    var email;

    beforeEach(function() {
      email = {
        quoteTemplate: 'default',
        quoted: {
          from: {
            name: 'test',
            email: 'test@open-paas.org'
          },
          subject: 'Heya',
          date: '2015-08-21T00:10:00Z',
          htmlBody: '<p>HtmlBody</p>'
        }
      };
    });

    it('should quote the original email, using htmlBody', function(done) {
      emailBodyService.quoteOriginalEmail(email)
        .then(function(text) {
          expect(text).to.equal('<pre></pre><br/><div><p>HtmlBody</p></div>');
        })
        .then(done, done);

      $rootScope.$digest();
    });

    it('should quote the original email, keeping the already entered text when present', function(done) {
      email.textBody = 'I was previously typed';

      emailBodyService.quoteOriginalEmail(email)
        .then(function(text) {
          expect(text).to.equal('<pre>I was previously typed</pre><br/><div><p>HtmlBody</p></div>');
        })
        .then(done, done);

      $rootScope.$digest();
    });

  });

});
