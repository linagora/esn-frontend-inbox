const _ = require('lodash');

require('./services/with-jmap-client/with-jmap-client.js');
require('./services/config/config.js');
require('./services/jmap-client-wrapper/jmap-client-wrapper.service.js');
require('./services/jmap-helper/jmap-helper.js');
require('./services/mailboxes/mailboxes-service.js');
require('./services/hook/email-sending-hook.service.js');
require('./services/email-body/email-body.js');
require('./services/attachment-jmap/attachment-jmap.constants.js');
require('./services/email-resolver/inbox-email-resolver.service.js');
require('./services/jmap-client-provider/jmap-client-provider.js');

(function (angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('backgroundAction', function (asyncAction, inBackground) {
      return function (message, action, options) {
        return asyncAction(message, function () {
          return inBackground(action());
        }, options);
      };
    })

    .factory('asyncJmapAction', function (backgroundAction, withJmapClient) {
      return function (message, action, options) {
        return backgroundAction(message, function () {
          return withJmapClient(action);
        }, options);
      };
    })

    .factory('sendEmail', function ($http, $q, inboxConfig, inBackground, jmapDraft, withJmapClient, inboxJmapHelper, inboxMailboxesService, httpConfigurer, inboxEmailSendingHookService) {
      function sendBySmtp(email) {
        return $http.post(httpConfigurer.getUrl('/unifiedinbox/api/inbox/sendemail'), email);
      }

      function sendByJmapDirectlyToOutbox(client, message) {
        return inboxMailboxesService.getMailboxWithRole(jmapDraft.MailboxRole.OUTBOX).then(function (outbox) {
          return client.send(message, outbox);
        });
      }

      function sendEmailWithHooks(email) {
        return inboxEmailSendingHookService.preSending(email).then(sendEmail).then(inboxEmailSendingHookService.postSending);
      }

      function sendEmail(email) {
        return withJmapClient(function (client) {
          return $q.all([
            inboxConfig('isJmapSendingEnabled'),
            inboxJmapHelper.toOutboundMessage(client, email)
          ]).then(function (data) {
            var isJmapSendingEnabled = data[0],
              message = data[1];

            if (!isJmapSendingEnabled) {
              return sendBySmtp(message);
            }

            return sendByJmapDirectlyToOutbox(client, message);
          });
        });
      }

      return function (email) {
        return inBackground(sendEmailWithHooks(email));
      };
    })

    .factory('emailSendingService', function ($q, emailService, jmapDraft, session, emailBodyService, sendEmail, inboxJmapHelper, INBOX_ATTACHMENT_TYPE_JMAP, INBOX_MESSAGE_HEADERS) {
      var referencingEmailOptions = {
        reply: {
          subjectPrefix: 'Re: ',
          recipients: getReplyRecipients,
          referenceIdHeader: INBOX_MESSAGE_HEADERS.REPLY_TO
        },
        forward: {
          subjectPrefix: 'Fwd: ',
          templateName: 'forward',
          includeAttachments: true,
          referenceIdHeader: INBOX_MESSAGE_HEADERS.FORWARD
        },
        replyAll: {
          subjectPrefix: 'Re: ',
          recipients: getReplyAllRecipients,
          referenceIdHeader: INBOX_MESSAGE_HEADERS.REPLY_TO
        }
      };

      return {
        emailsAreValid: emailsAreValid,
        removeDuplicateRecipients: removeDuplicateRecipients,
        removeReadReceiptRequest: removeReadReceiptRequest,
        addReadReceiptRequest: addReadReceiptRequest,
        getReadReceiptRequest: getReadReceiptRequest,
        noRecipient: noRecipient,
        sendEmail: sendEmail,
        prefixSubject: prefixSubject,
        getReplyRecipients: getReplyRecipients,
        getReplyAllRecipients: getReplyAllRecipients,
        getFirstRecipient: getFirstRecipient,
        getAllRecipientsExceptSender: getAllRecipientsExceptSender,
        showReplyAllButton: showReplyAllButton,
        createReplyAllEmailObject: _createQuotedEmail.bind(null, referencingEmailOptions.replyAll),
        createReplyEmailObject: _createQuotedEmail.bind(null, referencingEmailOptions.reply),
        createForwardEmailObject: _createQuotedEmail.bind(null, referencingEmailOptions.forward),
        countRecipients: countRecipients,
        handleInlineImageBeforeSending: handleInlineImageBeforeSending
      };

      /**
       * Add the following logic when sending an email: Check for an invalid email used as a recipient
       *
       * @param {Object} email
       */
      function emailsAreValid(email) {
        if (!email) {
          return false;
        }

        return [].concat(email.to || [], email.cc || [], email.bcc || []).every(function (recipient) {
          return emailService.isValidEmail(recipient.email);
        });
      }

      /**
       * Add the following logic when sending an email:
       *  Add the same recipient multiple times, in multiples fields (TO, CC...): allowed.
       *  This multi recipient must receive the email as a TO > CC > BCC recipient in this order.
       *  If the person is in TO and CC, s/he receives as TO. If s/he is in CC/BCC, receives as CC, etc).
       *
       * @param {Object} email
       */
      function removeDuplicateRecipients(email) {
        var notIn = function (array) {
          return function (item) {
            return !_.find(array, { email: item.email });
          };
        };

        if (!email) {
          return;
        }

        email.to = email.to || [];
        email.cc = (email.cc || []).filter(notIn(email.to));
        email.bcc = (email.bcc || []).filter(notIn(email.to)).filter(notIn(email.cc));
      }

      function addReadReceiptRequest(message) {
        var senderAddress = getEmailAddress(session.user);

        message.headers = message.headers || {};
        message.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT] = senderAddress;
      }

      function removeReadReceiptRequest(message) {
        if (message.headers && message.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT]) {
          delete message.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT];
        }
      }

      function getReadReceiptRequest(message, options) {
        options = options || {};

        if (!message || !message.headers || !message.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT]) {
          return false;
        }
        var recipient = message.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT];

        return options.asCurrentUser ?
          session.user.emails.indexOf(recipient) > -1 :
          session.user.emails.indexOf(recipient) < 0 && recipient;
      }

      function countRecipients(email) {
        if (!email) {
          return 0;
        }

        return _.size(email.to) + _.size(email.cc) + _.size(email.bcc);
      }

      /**
       * Add the following logic to email sending:
       *  Check whether the user is trying to send an email with no recipient at all
       *
       * @param {Object} email
       */
      function noRecipient(email) {
        return countRecipients(email) === 0;
      }

      function prefixSubject(subject, prefix) {
        if (!subject || !prefix) {
          return subject;
        }

        if (prefix.indexOf(' ', prefix.length - 1) === -1) {
          prefix = prefix + ' ';
        }

        if (subject.slice(0, prefix.length) === prefix) {
          return subject;
        }

        return prefix + subject;
      }

      function getFirstRecipient(email) {
        return _.head(email.to) || _.head(email.cc) || _.head(email.bcc);
      }

      function showReplyAllButton(email) {
        var nbRecipients = countRecipients(email);

        return nbRecipients > 1 || nbRecipients === 1 && getEmailAddress(getFirstRecipient(email)) !== getEmailAddress(session.user);
      }

      function getEmailAddress(recipient) {
        if (recipient) {
          return recipient.email || recipient.preferredEmail;
        }
      }

      function getAllRecipientsExceptSender(email) {
        var sender = session.user;

        return [].concat(email.to || [], email.cc || [], email.bcc || []).filter(function (recipient) {
          return recipient.email !== getEmailAddress(sender);
        });
      }

      function getReplyToRecipients(email) {
        var replyTo = _.reject(email.replyTo, { email: jmapDraft.EMailer.unknown().email });

        return replyTo.length > 0 ? replyTo : [email.from];
      }

      function getReplyAllRecipients(email, sender) {
        function notMe(item) {
          return item.email !== getEmailAddress(sender);
        }

        if (!email || !sender) {
          return;
        }

        return {
          to: _(email.to || []).concat(getReplyToRecipients(email)).uniq('email').value().filter(notMe),
          cc: (email.cc || []).filter(notMe),
          bcc: email.bcc || []
        };
      }

      function getReplyRecipients(email) {
        if (!email) {
          return;
        }

        return {
          to: getReplyToRecipients(email),
          cc: [],
          bcc: []
        };
      }

      function _enrichWithQuote(email, body) {
        if (emailBodyService.supportsRichtext()) {
          email.htmlBody = body;
        } else {
          email.textBody = body;
        }

        email.isQuoting = true;

        return email;
      }

      function handleInlineImageBeforeSending(email) {
        if (
          !email.attachments ||
          !email.attachments.length ||
          !email.mappingsUrlAndCid
        ) {
          return email;
        }

        email.mappingsUrlAndCid.forEach(function (mapping) {
          email.htmlBody = email.htmlBody.replace(mapping.url, 'cid:' + mapping.cid);
        });

        delete email.mappingsUrlAndCid;

        return email;
      }

      function _addReferenceToOriginalMessage(referencedMessageIdsHeaderName, parentMessage) {
        if (!parentMessage.headers || !referencedMessageIdsHeaderName) {
          return;
        }
        var quotedId = parentMessage.headers['Message-ID'],
          parentReferences = parentMessage.headers.References || '',
          parentReferencesAsArray = parentReferences && parentReferences.split(' ')
            .map(Function.prototype.call, String.prototype.trim).filter(Boolean),
          newHeaders = { References: [].concat(parentReferencesAsArray, [quotedId]).filter(Boolean).join(' ') };

        newHeaders[referencedMessageIdsHeaderName] = parentMessage.headers['Message-ID'];

        return newHeaders;
      }

      function _createQuotedEmail(opts, messageId, sender) {
        return inboxJmapHelper.getMessageById(messageId).then(function (message) {
          var newRecipients = opts.recipients ? opts.recipients(message, sender) : {},
            newEmail = {
              from: getEmailAddress(sender),
              to: newRecipients.to || [],
              cc: newRecipients.cc || [],
              bcc: newRecipients.bcc || [],
              subject: prefixSubject(message.subject, opts.subjectPrefix),
              quoted: message,
              isQuoting: false,
              quoteTemplate: opts.templateName || 'default',
              headers: _addReferenceToOriginalMessage(opts.referenceIdHeader, message)
            };

          var handleAttachment = opts.includeAttachments ?
            _handleAttachmentInQuoteOfForwardMail : _handleAttachmentInQuoteOfReplyMail;

          return handleAttachment(message, newEmail)
            .then(function () {
              // We do not automatically quote the message if we're using a plain text editor and the message
              // has a HTML body. In this case the "Edit Quoted Mail" button will show
              if (!emailBodyService.supportsRichtext() && message.htmlBody) {
                return emailBodyService.quote(newEmail, opts.templateName, true).then(function (body) {
                  newEmail.quoted.htmlBody = body;

                  return newEmail;
                });
              }

              return emailBodyService.quote(newEmail, opts.templateName)
                .then(function (body) {
                  return _enrichWithQuote(newEmail, body);
                });
            });
        });
      }

      function _handleAttachmentInQuoteOfForwardMail(message, newEmail) {
        if (!message.attachments || !message.attachments.length) {
          return $q.when();
        }

        var inlineAttachments = _getInlineAttachments(message.attachments);
        var nonInlineAttachments = message.attachments.filter(function (attachment) {
          return !attachment.isInline;
        });

        newEmail.attachments = [];

        if (nonInlineAttachments.length) {
          nonInlineAttachments.forEach(function (attachment) {
            attachment.attachmentType = INBOX_ATTACHMENT_TYPE_JMAP;
            attachment.status = 'uploaded';

            newEmail.attachments.push(attachment);
          });
        }

        if (!inlineAttachments.length) {
          return $q.when();
        }

        return _handleInlineAttachment(newEmail, inlineAttachments);
      }

      function _handleAttachmentInQuoteOfReplyMail(message, newEmail) {
        if (!message.attachments || !message.attachments.length) {
          return $q.when();
        }

        var inlineAttachments = _getInlineAttachments(message.attachments);

        if (!inlineAttachments.length) {
          return $q.when();
        }

        newEmail.attachments = [];

        return _handleInlineAttachment(newEmail, inlineAttachments);
      }

      function _handleInlineAttachment(newEmail, attachments) {
        var inlineCids = _getCidFromImageSources(newEmail.quoted.htmlBody);

        attachments.forEach(function (attachment) {
          newEmail.attachments.push(attachment);
        });

        return _getInlineImageMappingsUrlAndCid(inlineCids, attachments)
          .then(function (mappings) {
            newEmail.mappingsUrlAndCid = mappings;
            mappings.forEach(function (mapping) {
              newEmail.quoted.htmlBody = newEmail.quoted.htmlBody.replace('cid:' + mapping.cid, mapping.url);
            });
          });
      }

      function _getInlineAttachments(attachments) {
        return attachments.filter(function (attachment) {
          return attachment.isInline;
        });
      }

      function _getCidFromImageSources(messageBody) {
        var document = new DOMParser().parseFromString(messageBody, 'text/html');
        var elements = document.getElementsByTagName('img');

        // elements is a HTMLCollection and isn't a 'true' array,
        // elements doesn't have 'forEach', 'map' function like an array. Therefore, we have to convert it to array.
        return [].map.call(elements, function (element) {
          var cidMatch = element &&
            element.src &&
            element.src.match(/^cid:(\S+)/);

          return cidMatch && cidMatch[1];
        }).filter(Boolean);
      }

      function _getInlineImageMappingsUrlAndCid(cids, attachments) {
        var mappingPromises = [];

        cids.forEach(function (cid) {
          var inlineAttachment = _.find(attachments, function (attachment) {
            return attachment.cid === cid;
          });

          if (inlineAttachment && inlineAttachment.getSignedDownloadUrl) {
            mappingPromises.push(inlineAttachment.getSignedDownloadUrl().then(function (url) {
              return { url: url, cid: inlineAttachment.cid };
            }));
          }
        });

        return mappingPromises.length > 0 ? $q.all(mappingPromises) : $q.when([]);
      }
    })

    .factory('waitUntilMessageIsComplete', function ($q) {
      function attachmentsAreReady(message) {
        return _.size(message.attachments) === 0 ||
          _.every(message.attachments, function (attachment) {
            return attachment.status === 'uploaded' || (!attachment.upload || !attachment.upload.promise) && !attachment.status;
          });
      }

      return function (message) {
        if (attachmentsAreReady(message)) {
          return $q.when(message);
        }

        return $q.all(message.attachments.map(function (attachment) {
          return attachment.upload && attachment.upload.promise || $q.when();
        })).then(_.constant(message));
      };
    })

    .factory('inboxMailboxesCache', function () {
      return [];
    })

    .factory('inboxCacheService', function (Cache, inboxEmailResolverService, INBOX_CACHE_TTL) {
      var cache = new Cache({
        loader: inboxEmailResolverService.resolve,
        ttl: INBOX_CACHE_TTL
      });

      return {
        resolveEmail: resolveEmail
      };

      function resolveEmail(email) {
        return cache.get(email);
      }
    })

    .service('searchService', function (attendeeService, INBOX_AUTOCOMPLETE_LIMIT, INBOX_AUTOCOMPLETE_OBJECT_TYPES) {
      return {
        searchRecipients: searchRecipients
      };

      function searchRecipients(query, excludes) {
        return attendeeService.getAttendeeCandidates(query, INBOX_AUTOCOMPLETE_LIMIT, INBOX_AUTOCOMPLETE_OBJECT_TYPES, excludes).then(function (recipients) {
          return recipients
            .filter(_.property('email'))
            .map(function (recipient) {
              recipient.name = recipient.name || recipient.displayName || recipient.email;

              return recipient;
            });
        }, _.constant([]));
      }
    })

    .service('attachmentUploadService', function ($q, $rootScope, inboxConfig, jmapClientProvider, inBackground, xhrWithUploadProgress) {
      function in$Apply(fn) {
        return function (value) {
          if ($rootScope.$$phase) {
            return fn(value);
          }

          return $rootScope.$apply(function () {
            fn(value);
          });
        };
      }

      //eslint-disable-next-line no-unused-vars
      function uploadFile(unusedUrl, file, type, size, options, canceler) {
        return $q.all([
          jmapClientProvider.get(),
          inboxConfig('uploadUrl')
        ]).then(function (data) {
          var authToken = data[0].authToken,
            url = data[1],
            defer = $q.defer(),
            request = $.ajax({
              type: 'POST',
              headers: {
                Authorization: authToken
              },
              url: url,
              contentType: type,
              data: file,
              processData: false,
              dataType: 'json',
              success: in$Apply(defer.resolve),
              error: function (xhr, status, error) {
                in$Apply(defer.reject)({
                  xhr: xhr,
                  status: status,
                  error: error
                });
              },
              xhr: xhrWithUploadProgress(in$Apply(defer.notify))
            });

          if (canceler) {
            canceler.then(request.abort);
          }

          return inBackground(defer.promise);
        });
      }

      return {
        uploadFile: uploadFile
      };
    })

    .factory('inboxSwipeHelper', function ($timeout, $q, inboxConfig, INBOX_SWIPE_DURATION) {
      function _autoCloseSwipeHandler(scope) {
        $timeout(scope.swipeClose, INBOX_SWIPE_DURATION, false);

        return $q.when();
      }

      function createSwipeRightHandler(scope, handlers) {
        return function () {
          return _autoCloseSwipeHandler(scope)
            .then(inboxConfig.bind(null, 'swipeRightAction', 'markAsRead'))
            .then(function (action) {
              return handlers[action]();
            });
        };
      }

      return {
        createSwipeRightHandler: createSwipeRightHandler
      };
    })

    .factory('inboxUnavailableAccountNotifier', function ($rootScope, INBOX_EVENTS) {
      return function (account) {
        $rootScope.$broadcast(INBOX_EVENTS.UNAVAILABLE_ACCOUNT_DETECTED, account);
      };
    })

    .factory('inboxAsyncHostedMailControllerHelper', function ($q, session, INBOX_CONTROLLER_LOADING_STATES) {
      return function (controller, action, errorHandler) {
        controller.account = {
          name: session.user.preferredEmail
        };

        controller.load = function () {
          controller.state = INBOX_CONTROLLER_LOADING_STATES.LOADING;

          return action().then(function (value) {
            controller.state = INBOX_CONTROLLER_LOADING_STATES.LOADED;

            return value;
          }, function (err) {
            controller.state = INBOX_CONTROLLER_LOADING_STATES.ERROR;
            errorHandler && errorHandler(session.user.preferredEmail);

            return $q.reject(err);
          });
        };

        return controller.load(); // Try load when controller is first initialized
      };
    });
})(angular);