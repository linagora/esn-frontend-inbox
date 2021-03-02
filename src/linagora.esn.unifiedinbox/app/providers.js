const _ = require('lodash');

require('./directives/lists.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('inboxProviders', function(Providers) {
      return new Providers();
    })

    .factory('inboxHostedMailAttachmentProvider', function(withJmapClient, pagedJmapRequest, newProvider,
      inboxMailboxesService, inboxJmapProviderContextBuilder,
      JMAP_GET_MESSAGES_ATTACHMENTS_LIST, ELEMENTS_PER_REQUEST, PROVIDER_TYPES) {
      var hasTrueAttachment = function(obj) { return !obj.isInline && obj.name !== 'meeting.ics' && obj.name !== null; };

      return newProvider({
        type: PROVIDER_TYPES.JMAP,
        name: 'Attachments',
        fetch: function(filter) {
          return pagedJmapRequest(function(position) {
            return withJmapClient(function(client) {
              return client.getMessageList({
                filter: angular.extend(filter, { hasAttachment: true }),
                sort: ['date desc'],
                collapseThreads: false,
                fetchMessages: false,
                position: position,
                limit: ELEMENTS_PER_REQUEST
              })
                .then(function(messageList) {
                  return messageList.getMessages({ properties: JMAP_GET_MESSAGES_ATTACHMENTS_LIST })
                    .then(function(messageList) {
                      const messageTrueAttachmentList = [];

                      messageList.map(function(message) {
                        const trueAttachment = message.attachments && message.attachments.filter(hasTrueAttachment) || [];

                        if (trueAttachment.length > 0) {
                          message.attachments = trueAttachment;
                        }

                        messageTrueAttachmentList.push(message);
                      });

                      return messageTrueAttachmentList;
                    });
                });
            });
          });
        },
        buildFetchContext: function(options) {
          return (options.id && inboxMailboxesService.getMessageListFilter(options.id)) || inboxJmapProviderContextBuilder(options);
        },
        templateUrl: '/unifiedinbox/views/components/sidebar/attachment/sidebar-attachment-item.html'
      });
    })

    .factory('inboxHostedMailThreadsProvider', function($q, withJmapClient, pagedJmapRequest, inboxJmapProviderContextBuilder,
      newProvider, JMAP_GET_MESSAGES_LIST, ELEMENTS_PER_REQUEST, PROVIDER_TYPES) {
      function _prepareThreads(data) {
        var threads = data[0],
          messages = data[1];

        messages.forEach(function(message) {
          _.find(threads, { id: message.threadId }).emails = [message];
        });

        return threads;
      }

      return newProvider({
        type: PROVIDER_TYPES.JMAP,
        name: 'inboxHostedMailThreadsProvider',
        fetch: function(filter) {
          return pagedJmapRequest(function(position) {
            return withJmapClient(function(client) {
              return client.getMessageList({
                filter: filter,
                sort: ['date desc'],
                collapseThreads: true,
                fetchThreads: false,
                fetchMessages: false,
                position: position,
                limit: ELEMENTS_PER_REQUEST
              })
                .then(function(messageList) {
                  return $q.all([
                    messageList.getThreads({ fetchMessages: false }),
                    messageList.getMessages({ properties: JMAP_GET_MESSAGES_LIST })
                  ]);
                })
                .then(_prepareThreads);
            });
          });
        },
        buildFetchContext: inboxJmapProviderContextBuilder,
        template: require('../views/unified-inbox/elements/thread.pug')
      });
    })

  /**
     * When the value of a dynamic translated text (%s) is relied on the result of the function
     * We'll watch the translated text when it's changed on get method on Object.defineProperty
     * The get method should return the updated value
     *
     * @param {Object} object         Base object to add property
     * @param {Object} property       Name of perperty to watch
     * @param {Function} callback     Function is runned every time we get property value
    */

    .factory('watchDynamicTranslatedValue', function() {
      return function(object, propertyName, callback) {
        Object.defineProperty(object, propertyName, {
          get() { return callback(); }
        });
      };
    });

})(angular);
