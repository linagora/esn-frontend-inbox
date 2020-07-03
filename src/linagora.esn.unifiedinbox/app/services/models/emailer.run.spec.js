'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The EMailer run block', function() {
  var $rootScope, jmapDraft, inboxCacheService, INBOX_AVATAR_SIZE;

  beforeEach(function() {
    module('linagora.esn.unifiedinbox');
  });

  beforeEach(inject(function(_$rootScope_, _jmapDraft_, _inboxCacheService_, _INBOX_AVATAR_SIZE_) {
    $rootScope = _$rootScope_;
    jmapDraft = _jmapDraft_;
    inboxCacheService = sinon.mock(_inboxCacheService_);
    INBOX_AVATAR_SIZE = _INBOX_AVATAR_SIZE_;
  }));

  afterEach(function() {
    inboxCacheService.verify();
  });

  it('should add a "resolve" method to jmapDraft.EMailer instances', function() {
    expect(new jmapDraft.EMailer().resolve).to.be.a('function');
  });

  it('should query the search service and use displayName and avatarUrl if available', function() {
    var emailer = new jmapDraft.EMailer({ email: 'a@a.com', name: 'a' });

    inboxCacheService
      .expects('resolveEmail')
      .once()
      .withExactArgs('a@a.com')
      .returns($q.when({
        objectType: 'contact',
        names: [{ displayName: 'displayName' }],
        photos: [{ url: '/photo' }]
      }));

    emailer.resolve();
    $rootScope.$digest();

    expect(emailer.avatarUrl).to.equal('/photo');
    expect(emailer.name).to.equal('displayName');
  });

  it('should query the search service and use displayName and avatarUrl if available if the resolved object type is "user"', function() {
    var emailer = new jmapDraft.EMailer({ email: 'a@a.com', name: 'a' });

    inboxCacheService
      .expects('resolveEmail')
      .once()
      .withExactArgs('a@a.com')
      .returns($q.when({
        objectType: 'user',
        names: [{ displayName: 'displayName' }],
        photos: [{ url: '/photo' }]
      }));

    emailer.resolve();
    $rootScope.$digest();

    expect(emailer.avatarUrl).to.equal('/photo');
    expect(emailer.name).to.equal('a');
  });

  it('should query the search service and use existing name and generated avatar if not info is not available', function() {
    var emailer = new jmapDraft.EMailer({ email: 'a@a.com', name: 'a' });

    inboxCacheService
      .expects('resolveEmail')
      .once()
      .withExactArgs('a@a.com')
      .returns($q.when({}));

    emailer.resolve();
    $rootScope.$digest();

    expect(emailer.avatarUrl).to.equal('/api/avatars?email=a@a.com&objectType=email&displayName=a');
    expect(emailer.name).to.equal('a');
  });

  it('should query the search service and use existing name and generated avatar if search fails', function() {
    var emailer = new jmapDraft.EMailer({ email: 'a@a.com', name: 'a' });

    inboxCacheService
      .expects('resolveEmail')
      .once()
      .withExactArgs('a@a.com')
      .returns($q.reject(new Error()));

    emailer.resolve();
    $rootScope.$digest();

    expect(emailer.avatarUrl).to.equal('/api/avatars?email=a@a.com&objectType=email&displayName=a');
    expect(emailer.name).to.equal('a');
  });

  it('should define objectType and id from the found match', function() {
    var emailer = new jmapDraft.EMailer({ email: 'a@a.com', name: 'a' });

    inboxCacheService
      .expects('resolveEmail')
      .once()
      .withExactArgs('a@a.com')
      .returns($q.when({
        objectType: 'user',
        id: 'myId',
        displayName: 'displayName',
        avatarUrl: '/photo'
      }));

    emailer.resolve();
    $rootScope.$digest();

    expect(emailer.objectType).to.equal('user');
    expect(emailer.id).to.equal('myId');
  });

  it('should resolve with an object suitable for esnAvatar', function(done) {
    var emailer = new jmapDraft.EMailer({ email: 'a@a.com', name: 'a' });

    inboxCacheService
      .expects('resolveEmail')
      .once()
      .withExactArgs('a@a.com')
      .returns($q.when({
        objectType: 'user',
        id: 'myId',
        names: [{ displayName: 'displayName' }],
        photos: [{ url: '/photo' }]
      }));

    emailer.resolve().then(function(avatar) {
      expect(avatar).to.deep.equal({
        id: 'myId',
        url: '/photo?size=' + INBOX_AVATAR_SIZE,
        email: 'a@a.com'
      });

      done();
    });
    $rootScope.$digest();
  });

  it('should set avatar.id only if the match is a user', function(done) {
    var emailer = new jmapDraft.EMailer({ email: 'a@a.com', name: 'a' });

    inboxCacheService
      .expects('resolveEmail')
      .once()
      .withExactArgs('a@a.com')
      .returns($q.when({
        objectType: 'contact',
        id: 'myId',
        names: [{ displayName: 'displayName' }],
        photos: [{ url: '/photo' }]
      }));

    emailer.resolve().then(function(avatar) {
      expect(avatar).to.deep.equal({
        id: false,
        url: '/photo?size=' + INBOX_AVATAR_SIZE,
        email: 'a@a.com'
      });

      done();
    });
    $rootScope.$digest();
  });

});
