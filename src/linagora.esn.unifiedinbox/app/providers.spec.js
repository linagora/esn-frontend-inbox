'use strict';

/* global chai: false, sinon: false */

const { expect } = chai;

describe('The Unified Inbox Angular module providers', function() {

  var $rootScope, inboxProviders, inboxHostedMailAttachmentProvider, inboxHostedMailThreadsProvider, inboxSearchResultsProvider,
    jmapClient, inboxConfigMock, jmapDraft, ELEMENTS_PER_REQUEST;

  function elements(id, length, offset) {
    var array = [], start = offset || 0;

    for (var i = start; i < (start + length); i++) {
      array.push({
        id: id + '_' + i,
        date: new Date(2016, 1, 1, 1, 1, 1, i), // The variable millisecond is what allows us to check ordering in the tests
        mailboxIds: ['id_inbox'],
        threadId: 'thread_' + i,
        hasAttachment: true,
        attachments: [
          { isInline: false, name: 'meeting.ics' },
          { isInline: false, name: 'file.pdf' },
          { isInline: false, name: null },
          { isInline: true, name: 'picture.jpg' }
        ]
      });
    }

    return array;
  }

  beforeEach(function() {
    angular.mock.module('esn.core');
    angular.mock.module('esn.configuration');
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      jmapClient = {
        getMailboxes: function() {
          return $q.when([
            new jmapDraft.Mailbox({}, 'id_inbox', 'name_inbox', { role: 'inbox' }),
            new jmapDraft.Mailbox({}, 'id_trash', 'name_trash', { role: 'trash' }),
            new jmapDraft.Mailbox({}, 'id_spam', 'name_spam', { role: 'spam' })
          ]);
        },
        getMessageList: function(options) {
          expect(options.filter.inMailboxes).to.deep.equal(['id_inbox']);

          return $q.when({
            messageIds: [1],
            getMessages: function() {
              return $q.when(elements('message', options.limit, options.position));
            },
            getThreads: function() {
              return $q.when(elements('thread', options.limit, options.position));
            }
          });
        }
      };

      $provide.value('withJmapClient', function(cb) {
        return cb(jmapClient);
      });
      $provide.decorator('inboxMailboxesService', function($delegate) {
        $delegate.flagIsUnreadChanged = sinon.spy($delegate.flagIsUnreadChanged);

        return $delegate;
      });
      inboxConfigMock = {};
      $provide.value('inboxConfig', function(key, defaultValue) {
        return $q.when(angular.isDefined(inboxConfigMock[key]) ? inboxConfigMock[key] : defaultValue);
      });
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _inboxProviders_, _inboxSearchResultsProvider_,
    _inboxHostedMailAttachmentProvider_, _inboxHostedMailThreadsProvider_, _jmapDraft_, _ELEMENTS_PER_REQUEST_) {
    $rootScope = _$rootScope_;
    inboxProviders = _inboxProviders_;
    inboxSearchResultsProvider = _inboxSearchResultsProvider_;
    inboxHostedMailAttachmentProvider = _inboxHostedMailAttachmentProvider_;
    inboxHostedMailThreadsProvider = _inboxHostedMailThreadsProvider_;
    jmapDraft = _jmapDraft_;

    ELEMENTS_PER_REQUEST = _ELEMENTS_PER_REQUEST_;
  }));

  describe('The inboxSearchResultsProvider factory', function() {

    it('should request the backend using the JMAP client, and return pages of messages', function(done) {
      var filter = { inMailboxes: ['id_inbox'] };
      var fetcher = inboxSearchResultsProvider.fetch(filter);

      fetcher().then(function(messages) {
        expect(messages.length).to.equal(ELEMENTS_PER_REQUEST);
        expect(messages[ELEMENTS_PER_REQUEST - 1]).to.shallowDeepEqual({
          id: 'message_0'
        });
      });
      $rootScope.$digest();

      fetcher().then(function(messages) {
        expect(messages.length).to.equal(ELEMENTS_PER_REQUEST);
        expect(messages[ELEMENTS_PER_REQUEST - 1]).to.shallowDeepEqual({
          id: 'message_' + ELEMENTS_PER_REQUEST
        });

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The inboxHostedMailAttachmentProvider factory', function() {

    it('should request the backend using the JMAP client, and return pages of messages', function(done) {
      var filter = { inMailboxes: ['id_inbox'] };
      var fetcher = inboxHostedMailAttachmentProvider.fetch(filter);

      fetcher().then(function(messages) {
        expect(messages.length).to.equal(ELEMENTS_PER_REQUEST);
        expect(messages[ELEMENTS_PER_REQUEST - 1]).to.shallowDeepEqual({
          id: 'message_' + (ELEMENTS_PER_REQUEST - 1)
        });
      });
      $rootScope.$digest();

      fetcher().then(function(messages) {
        expect(messages.length).to.equal(ELEMENTS_PER_REQUEST);
        expect(messages[ELEMENTS_PER_REQUEST - 1]).to.shallowDeepEqual({
          id: 'message_' + (ELEMENTS_PER_REQUEST * 2 - 1)
        });

        done();
      });
      $rootScope.$digest();
    });

    it('should request the backend using the JMAP client, and return TRUE attchments messages', function(done) {
      var trueMessageList = [{
        mailboxIds: ['id_inbox'],
        hasAttachment: true,
        attachments: [
          { isInline: false, name: 'file.pdf' }
        ]
      },
      {
        mailboxIds: ['id_inbox'],
        hasAttachment: true,
        attachments: [
          { isInline: false, name: 'file.pdf' }
        ]
      }];

      var messageList = [{
        mailboxIds: ['id_inbox'],
        hasAttachment: true,
        attachments: [
          { isInline: false, name: 'meeting.ics' },
          { isInline: false, name: 'file.pdf' },
          { isInline: false, name: null },
          { isInline: true, name: 'picture.jpg' }
        ]
      },
      {
        mailboxIds: ['id_inbox'],
        hasAttachment: true,
        attachments: [
          { isInline: false, name: 'meeting.ics' },
          { isInline: false, name: 'file.pdf' },
          { isInline: false, name: null },
          { isInline: true, name: 'picture.jpg' }
        ]
      },
      {
        mailboxIds: ['id_inbox'],
        hasAttachment: false,
        attachments: []
      }];

      var filter = { inMailboxes: ['id_inbox'] };
      var fetcher = inboxHostedMailAttachmentProvider.fetch(filter);

      jmapClient.getMessageList = sinon.stub().returns($q.when({
        getMessages: function() {
          return $q.when(messageList);
        }
      }));

      fetcher().then(function(messages) {
        expect(messages.length).to.equal(trueMessageList.length);
        expect(messages).to.deep.equal(trueMessageList);

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The inboxHostedMailThreadsProvider factory', function() {

    it('should have fetch function to resolve an array of thread', function(done) {
      var filter = { inMailboxes: ['id_inbox'] };
      var fetcher = inboxHostedMailThreadsProvider.fetch(filter);

      fetcher().then(function(threads) {
        expect(threads).to.be.an.instanceof(Array);
        expect(threads[0].emails).to.be.an.instanceof(Array);
        done();
      });

      $rootScope.$digest();
    });

    it('should request the backend using the JMAP client, and return pages of threads', function(done) {
      var filter = { inMailboxes: ['id_inbox'] };
      var fetcher = inboxHostedMailThreadsProvider.fetch(filter);

      fetcher().then(function(threads) {
        expect(threads.length).to.equal(ELEMENTS_PER_REQUEST);
        expect(threads[ELEMENTS_PER_REQUEST - 1]).to.shallowDeepEqual({
          id: 'thread_' + (ELEMENTS_PER_REQUEST - 1)
        });
      });
      $rootScope.$digest();

      fetcher().then(function(threads) {
        expect(threads.length).to.equal(ELEMENTS_PER_REQUEST);
        expect(threads[ELEMENTS_PER_REQUEST - 1]).to.shallowDeepEqual({
          id: 'thread_' + (ELEMENTS_PER_REQUEST * 2 - 1)
        });

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The inboxProviders factory', function() {

    describe('The getAll function', function() {

      it('should return an array of providers, with the "loadNextItems" property initialized', function(done) {
        var provider1 = {
            buildFetchContext: sinon.spy(function() { return $q.when('container'); }),
            fetch: sinon.spy(function(container) {
              expect(container).to.equal('container');

              return function() {
                return $q.when(elements('id', 2));
              };
            }),
            templateUrl: 'templateUrl'
          },
          provider2 = {
            buildFetchContext: sinon.spy(function() { return $q.when('container_2'); }),
            fetch: sinon.spy(function(container) {
              expect(container).to.equal('container_2');

              return function() {
                return $q.when(elements('id', ELEMENTS_PER_REQUEST));
              };
            }),
            templateUrl: 'templateUrl'
          };

        inboxProviders.add(provider1);
        inboxProviders.add(provider2);

        function enrichWithProvider(provider) {
          return function(item) {
            item.provider = provider;
            item.templateUrl = provider.templateUrl;

            return item;
          };
        }

        inboxProviders.getAll().then(function(providers) {
          $q.all(providers.map(function(provider) {
            return provider.loadNextItems();
          })).then(function(results) {
            expect(results[0]).to.deep.equal({ data: elements('id', 2).map(enrichWithProvider(provider1)), lastPage: true });
            expect(results[1]).to.deep.equal({ data: elements('id', ELEMENTS_PER_REQUEST).map(enrichWithProvider(provider2)), lastPage: false });

            done();
          });
        });
        $rootScope.$digest();
      });

    });

  });

});
