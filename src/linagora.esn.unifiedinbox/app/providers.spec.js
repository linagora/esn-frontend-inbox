'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module providers', function() {

  var $rootScope, inboxProviders, inboxHostedMailMessagesProvider, inboxHostedMailAttachmentProvider, inboxHostedMailThreadsProvider, inboxSearchResultsProvider,
      jmapClient, inboxMailboxesService, inboxConfigMock, jmapDraft, computeUniqueSetOfRecipients, ELEMENTS_PER_REQUEST;

  function elements(id, length, offset) {
    var array = [], start = offset || 0;

    for (var i = start; i < (start + length); i++) {
      array.push({
        id: id + '_' + i,
        date: new Date(2016, 1, 1, 1, 1, 1, i), // The variable millisecond is what allows us to check ordering in the tests
        mailboxIds: ['id_inbox'],
        threadId: 'thread_' + i,
        hasAttachment: true
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

  beforeEach(angular.mock.inject(function(_$rootScope_, _inboxProviders_, _inboxHostedMailMessagesProvider_, _inboxSearchResultsProvider_,
                                          _inboxHostedMailAttachmentProvider_, _inboxHostedMailThreadsProvider_, _inboxMailboxesService_, _jmapDraft_,
                                          _computeUniqueSetOfRecipients_, _ELEMENTS_PER_REQUEST_) {
    $rootScope = _$rootScope_;
    inboxProviders = _inboxProviders_;
    inboxHostedMailMessagesProvider = _inboxHostedMailMessagesProvider_;
    inboxSearchResultsProvider = _inboxSearchResultsProvider_;
    inboxHostedMailAttachmentProvider = _inboxHostedMailAttachmentProvider_;
    inboxHostedMailThreadsProvider = _inboxHostedMailThreadsProvider_;
    inboxMailboxesService = _inboxMailboxesService_;
    jmapDraft = _jmapDraft_;
    computeUniqueSetOfRecipients = _computeUniqueSetOfRecipients_;

    ELEMENTS_PER_REQUEST = _ELEMENTS_PER_REQUEST_;
  }));

  describe('The inboxHostedMailMessagesProvider factory', function() {

    it('should request the backend using the JMAP client, and return pages of messages', function(done) {
      var filter = { inMailboxes: ['id_inbox'] };
      var fetcher = inboxHostedMailMessagesProvider.fetch(filter);

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

    it('should support fetching recent items', function(done) {
      var fetcher = inboxHostedMailMessagesProvider.fetch({ inMailboxes: ['id_inbox'] });

      jmapClient = {
        getMailboxWithRole: function(role) {
          return $q.when({ id: 'id_' + role.value });
        },
        getMessageList: function(options) {
          expect(options.filter).to.deep.equal({
            inMailboxes: ['id_inbox'],
            after: new Date(2016, 1, 1, 1, 1, 1, 199)
          });
          expect(options.position).to.equal(0);

          done();
        }
      };

      fetcher.loadRecentItems({
        date: new Date(2016, 1, 1, 1, 1, 1, 199)
      });
      $rootScope.$digest();
    });

    it('should update mailbox badge when fetching unread recent items', function() {
      var fetcher = inboxHostedMailMessagesProvider.fetch({ inMailboxes: ['id_inbox'] });

      jmapClient.getMessageList = function() {
        return $q.when({
          messageIds: ['id1', 'id2'],
          getMessages: function() {
            return $q.when([
              {
                id: 'id1',
                date: new Date(2016, 1, 1, 1, 1, 1, 0),
                mailboxIds: ['id_inbox'],
                isUnread: true
              },
              {
                id: 'id2',
                date: new Date(2016, 1, 1, 1, 1, 1, 0),
                mailboxIds: ['id_inbox', 'id_otherMailbox'],
                isUnread: true
              },
              {
                id: 'id3',
                date: new Date(2016, 1, 1, 1, 1, 1, 0),
                mailboxIds: ['id_inbox']
              }
            ]);
          }
        });
      };

      fetcher.loadRecentItems({});
      $rootScope.$digest();

      expect(inboxMailboxesService.flagIsUnreadChanged).to.have.been.calledWith(sinon.match({ id: 'id1' }));
      expect(inboxMailboxesService.flagIsUnreadChanged).to.have.been.calledWith(sinon.match({ id: 'id2' }));
      expect(inboxMailboxesService.flagIsUnreadChanged).to.have.not.been.calledWith(sinon.match({ id: 'id3' }));
    });

    it('should do not update mailbox badge when fetching unread old items', function() {
      var fetcher = inboxHostedMailMessagesProvider.fetch({ inMailboxes: ['id_inbox'] });
      var email = {
        id: 'id1',
        date: new Date(2014, 1, 1, 1, 1, 1, 0),
        mailboxIds: ['id_inbox'],
        isUnread: true
      };

      jmapClient.getMessageList = function() {
        return $q.when({
          messageIds: ['id1'],
          getMessages: function() {
            return $q.when([email]);
          }
        });
      };

      fetcher.loadRecentItems(email).then(function(mostRecentItem) {
        expect(mostRecentItem).to.deep.equal([]);
      });

      $rootScope.$digest();

      expect(inboxMailboxesService.flagIsUnreadChanged).to.have.not.been.called;
    });

    describe('The itemMatches function', function() {

      function newMessage(mailboxId, options) {
        return new jmapDraft.Message(null, 'id', 'blobId', 'threadId', [mailboxId || 'id_inbox'], options);
      }

      function jmapFilter(context, filter) {
        return {
          context: context,
          filterByType: {
            jmap: filter || {}
          }
        };
      }

      it('should resolve when item matches default context and neither context nor filter is selected', function(done) {
        inboxHostedMailMessagesProvider.options.itemMatches(newMessage(), jmapFilter()).then(done);
        $rootScope.$digest();
      });

      it('should resolve when item matches context and no filter is selected', function(done) {
        inboxHostedMailMessagesProvider.options.itemMatches(newMessage('other_mailbox'), jmapFilter('other_mailbox')).then(done);
        $rootScope.$digest();
      });

      it('should resolve when item matches negative context and no filter is selected', function(done) {
        inboxHostedMailMessagesProvider.options.itemMatches(newMessage('other_mailbox'), jmapFilter('all')).then(done);
        $rootScope.$digest();
      });

      it('should resolve when item matches context and filter', function(done) {
        inboxHostedMailMessagesProvider.options.itemMatches(newMessage('other_mailbox', { isUnread: true }), jmapFilter('other_mailbox', { isUnread: true })).then(done);
        $rootScope.$digest();
      });

      it('should reject when item does not match default context', function(done) {
        inboxHostedMailMessagesProvider.options.itemMatches(newMessage('other_mailbox'), jmapFilter()).catch(done);
        $rootScope.$digest();
      });

      it('should reject when item does not match context', function(done) {
        inboxHostedMailMessagesProvider.options.itemMatches(newMessage('other_mailbox'), jmapFilter('id_trash')).catch(done);
        $rootScope.$digest();
      });

      it('should reject when item does not match negative context', function(done) {
        inboxHostedMailMessagesProvider.options.itemMatches(newMessage('id_spam'), jmapFilter('all')).catch(done);
        $rootScope.$digest();
      });

      it('should reject when item does not match filter', function(done) {
        inboxHostedMailMessagesProvider.options.itemMatches(newMessage('id_inbox'), jmapFilter('', { isFlagged: true })).catch(done);
        $rootScope.$digest();
      });

    });

  });

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

  describe('The computeUniqueSetOfRecipients factory', function() {

    it('should dedupe and sort email message recipients', function() {
      var item = { id: 'id',
        to: [{email: '1@linagora.com'}, {displayName: 'deux', email: '2@linagora.com'}],
        cc: [{displayName: '3', email: '3@linagora.com'}, {displayName: '1', email: '1@linagora.com'}],
        bcc: [{displayName: '3', email: '3@linagora.com'}, {displayName: 'six', email: '6@linagora.com'}]
      };

      var result = computeUniqueSetOfRecipients(item);

      $rootScope.$digest();

      expect(result.emailRecipients).to.deep.equal([
        { email: '1@linagora.com' },
        { displayName: 'deux', email: '2@linagora.com' },
        { displayName: '3', email: '3@linagora.com' },
        { displayName: 'six', email: '6@linagora.com' }
      ]);
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

  describe('The inboxJmapProviderFilterBuilder', function() {
    var inboxJmapProviderFilterBuilder;

    beforeEach(angular.mock.inject(function(_inboxJmapProviderFilterBuilder_) {
      inboxJmapProviderFilterBuilder = _inboxJmapProviderFilterBuilder_;
    }));

    it('should build a filter on senders/from when query has one', function() {
      var searchOpts = { from: ['MAILERDAEMON'] };
      var expected = { from: 'MAILERDAEMON' };
      var jmapFilter = inboxJmapProviderFilterBuilder(searchOpts);

      expect(jmapFilter).to.deep.equal(expected);
    });

    it('should build a filter on sender/from when query has some', function() {
      var searchOpts = { from: ['MAILERDAEMON', 'noreply'] };
      var expected = {operator: 'AND', conditions: [{from: 'MAILERDAEMON'}, {from: 'noreply'}]};
      var jmapFilter = inboxJmapProviderFilterBuilder(searchOpts);

      expect(jmapFilter).to.deep.equal(expected);
    });

    it('should build a filter on subject when query includes some', function() {
      var searchOpts = { subject: ['Failure', 'Error'] };
      var expected = {operator: 'AND', conditions: [{subject: 'Failure'}, {subject: 'Error'}]};
      var jmapFilter = inboxJmapProviderFilterBuilder(searchOpts);

      expect(jmapFilter).to.deep.equal(expected);
    });

    it('should build a filter with hasAttachment filter', function() {
      var searchOpts = { from: ['noreply'], hasAttachment: [true] };
      var expected = {operator: 'AND', conditions: [{from: 'noreply'}, {hasAttachment: true}]};
      var jmapFilter = inboxJmapProviderFilterBuilder(searchOpts);

      expect(jmapFilter).to.deep.equal(expected);
    });

    it('should build a filter that excludes keywords', function() {
      var searchOpts = { from: ['noreply'], excluded: ['spam', 'trump'] };
      var expected = {operator: 'AND', conditions: [{from: 'noreply'}, {operator: 'NOT', conditions: [{ text: 'spam'}, {text: 'trump'}]}]};
      var jmapFilter = inboxJmapProviderFilterBuilder(searchOpts);

      expect(jmapFilter).to.deep.equal(expected);
    });

    it('should build a filter on multiple conditions', function() {
      var searchOpts = { from: ['MAILERDAEMON', 'noreply'], subject: ['Failure'], excluded: ['f_ck'], hasAttachment: [true]};
      var expected = {operator: 'AND', conditions: [
        {operator: 'AND', conditions: [
          {from: 'MAILERDAEMON'},
          {from: 'noreply'}
        ]},
        {subject: 'Failure'}, {hasAttachment: true},
        {operator: 'NOT', conditions: [
          {text: 'f_ck'}
        ]}
      ]};
      var jmapFilter = inboxJmapProviderFilterBuilder(searchOpts);

      expect(jmapFilter).to.deep.equal(expected);
    });

  });

  describe('The inboxJmapProviderContextBuilder', function() {

    var inboxJmapProviderContextBuilder;

    beforeEach(angular.mock.inject(function(_inboxJmapProviderContextBuilder_) {
      inboxJmapProviderContextBuilder = _inboxJmapProviderContextBuilder_;
    }));

    it('should build default context as a filter to get message list in Inbox folder', function() {
      inboxJmapProviderContextBuilder({ filterByType: {} }).then(function(context) {
        expect(context).to.deep.equal({
          inMailboxes: ['id_inbox'],
          text: undefined
        });
      });

      $rootScope.$digest();
    });

    it('should extend the JMAP filter when it is given', function() {
      inboxJmapProviderContextBuilder({
        filterByType: {
          jmap: { isUnread: true }
        }
      }).then(function(context) {
        expect(context).to.deep.equal({
          inMailboxes: ['id_inbox'],
          isUnread: true,
          text: undefined
        });
      });

      $rootScope.$digest();
    });

    it('should use quickFilter to filter on the backend side, when defined', function() {
      inboxJmapProviderContextBuilder({
        filterByType: {
          jmap: { isUnread: true }
        },
        quickFilter: 'filter'
      }).then(function(context) {
        expect(context).to.deep.equal({
          inMailboxes: ['id_inbox'],
          isUnread: true,
          text: 'filter'
        });
      });

      $rootScope.$digest();
    });

    it('should build search context when query is passed as an option', function() {
      inboxJmapProviderContextBuilder({query: {text: 'query'}}).then(function(context) {
        expect(context).to.deep.equal({
          text: 'query'
        });
      });

      $rootScope.$digest();
    });

    it('should build search context when advanced query is provided', function() {
      inboxJmapProviderContextBuilder({
        filterByType: {},
        query: {
          advanced: {
            to: [],
            from: [{email: 'user2'}],
            subject: 'subject',
            contains: 'a set of keywords',
            excluded: 'some ignored terms',
            hasAttachment: [true]
          }
        }
      }).then(function(context) {
        expect(context).to.deep.equal({
          operator: 'AND',
          conditions: [
            { from: 'user2' },
            { subject: 'subject' },
            { hasAttachment: true },
            {
              operator: 'AND',
              conditions: [{ text: 'a' }, { text: 'set' }, { text: 'of' }, { text: 'keywords' }]
            },
            {
              operator: 'NOT',
              conditions: [{ text: 'some' }, { text: 'ignored' }, { text: 'terms' }]
            }
          ]
        });
      });

      $rootScope.$digest();
    });

    it('should build empty search context when no criterion provided with query', function() {
      inboxJmapProviderContextBuilder({
        filterByType: {},
        query: {
          advanced: {
            to: [],
            from: [],
            subject: undefined,
            contains: '',
            excluded: '',
            hasAttachment: undefined
          }
        }
      }).then(function(context) {
        expect(context).to.deep.equal({});
      });

      $rootScope.$digest();
    });

    it('should build empty search context when no value criterion provided', function() {
      inboxJmapProviderContextBuilder({
        filterByType: {},
        query: {
            advanced: {
            to: ['this should be an object with an email property'],
            from: ['this should be an object with an email property'],
            subject: ['should not be included within an array'],
            contains: ['should not be included within an array'],
            excluded: ['should not be included within an array'],
            body: ['should not be included within an array']
          }
        }
      }).then(function(context) {
        expect(context).to.deep.equal({});
      });

      $rootScope.$digest();
    });

  });

});
