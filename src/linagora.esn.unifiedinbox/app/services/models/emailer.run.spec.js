'use strict';

/* global chai: false */

const { expect } = chai;

describe('The EMailer run block', function() {
  var $rootScope, jmapDraft, INBOX_AVATAR_SIZE;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _jmapDraft_, _inboxCacheService_, _INBOX_AVATAR_SIZE_) {
    $rootScope = _$rootScope_;
    jmapDraft = _jmapDraft_;
    INBOX_AVATAR_SIZE = _INBOX_AVATAR_SIZE_;
  }));

  it('should add a "resolve" method to jmapDraft.EMailer instances', function() {
    expect(new jmapDraft.EMailer().resolve).to.be.a('function');
  });

  it('should query the search service and use displayName and avatarUrl if available', function() {
    var emailer = new jmapDraft.EMailer({ email: 'a@a.com', name: 'a' });

    emailer.resolve();
    $rootScope.$digest();

    expect(emailer.avatarUrl).to.equal('/api/avatars?email=a@a.com&objectType=email&displayName=a');
    expect(emailer.name).to.equal('a');
  });

  it('should query the search service and use displayName and avatarUrl if available if the resolved object type is "user"', function() {
    var emailer = new jmapDraft.EMailer({ email: 'a@a.com', name: 'a' });

    emailer.resolve();
    $rootScope.$digest();

    expect(emailer.avatarUrl).to.equal('/api/avatars?email=a@a.com&objectType=email&displayName=a');
    expect(emailer.name).to.equal('a');
  });

  it('should query the search service and use existing name and generated avatar if not info is not available', function() {
    var emailer = new jmapDraft.EMailer({ email: 'a@a.com', name: 'a' });

    emailer.resolve();
    $rootScope.$digest();

    expect(emailer.avatarUrl).to.equal('/api/avatars?email=a@a.com&objectType=email&displayName=a');
    expect(emailer.name).to.equal('a');
  });

  it('should query the search service and use existing name and generated avatar if search fails', function() {
    var emailer = new jmapDraft.EMailer({ email: 'a@a.com', name: 'a' });

    emailer.resolve();
    $rootScope.$digest();

    expect(emailer.avatarUrl).to.equal('/api/avatars?email=a@a.com&objectType=email&displayName=a');
    expect(emailer.name).to.equal('a');
  });

  it('should define objectType and id from the found match', function() {
    var emailer = new jmapDraft.EMailer({ email: 'a@a.com', name: 'a' });

    emailer.resolve();
    $rootScope.$digest();

    expect(emailer.objectType).to.equal('email');
  });

  it('should resolve with an object suitable for esnAvatar', async() => {
    const emailer = new jmapDraft.EMailer({ email: 'a@a.com', name: 'a' });
    const resolved = await emailer.resolve();

    expect(resolved.url).to.equal('/api/avatars?email=a@a.com&objectType=email&displayName=a&size=' + INBOX_AVATAR_SIZE);
  });

  it('should set avatar.id only if the match is a user', async() => {
    const emailer = new jmapDraft.EMailer({ email: 'a@a.com', name: 'a' });
    const resolved = await emailer.resolve();

    expect(resolved).to.deep.equal({
      id: false,
      email: 'a@a.com',
      url: '/api/avatars?email=a@a.com&objectType=email&displayName=a&size=' + INBOX_AVATAR_SIZE
    });
  });
});
