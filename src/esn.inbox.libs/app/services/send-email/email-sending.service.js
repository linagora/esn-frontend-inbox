'use strict';

const _ = require('lodash');

require('../email-body/email-body');
require('../jmap-draft-helper/jmap-draft-helper');
require('../with-jmap-draft-client/with-jmap-draft-client');
require('../../app.constants');

angular.module('esn.inbox.libs')
  .factory('emailSendingService', function($q, emailService, jmapDraft, session, emailBodyService, sendEmail, inboxJmapDraftHelper,
    inboxMessagesCache, INBOX_ATTACHMENT_TYPE_JMAP, INBOX_MESSAGE_HEADERS, htmlCleaner) {
    const referencingEmailOptions = {
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
      },
      editAsNew: {
        recipients: getReplyAllRecipients,
        includeAttachments: true,
        templateName: 'editAsNew'
      }
    };

    return {
      emailsAreValid,
      removeDuplicateRecipients,
      removeReadReceiptRequest,
      addReadReceiptRequest,
      getReadReceiptRequest,
      noRecipient,
      sendEmail,
      prefixSubject,
      getReplyRecipients,
      getReplyAllRecipients,
      getFirstRecipient,
      getAllRecipientsExceptSender,
      showReplyAllButton,
      createReplyAllEmailObject: _createQuotedEmail.bind(null, referencingEmailOptions.replyAll),
      createReplyEmailObject: _createQuotedEmail.bind(null, referencingEmailOptions.reply),
      createForwardEmailObject: _createQuotedEmail.bind(null, referencingEmailOptions.forward),
      editAsNewEmailObject: _createQuotedEmail.bind(null, referencingEmailOptions.editAsNew),
      countRecipients,
      handleInlineImageBeforeSending
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

      return [].concat(email.to || [], email.cc || [], email.bcc || []).every(function(recipient) {
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
      const notIn = function(array) {
        return function(item) {
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
      const senderAddress = getEmailAddress(session.user);

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
      const recipient = message.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT];

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
      const nbRecipients = countRecipients(email);

      return nbRecipients > 1 || nbRecipients === 1 && getEmailAddress(getFirstRecipient(email)) !== getEmailAddress(session.user);
    }

    function getEmailAddress(recipient) {
      if (recipient) {
        return recipient.email || recipient.preferredEmail;
      }
    }

    function getAllRecipientsExceptSender(email) {
      const sender = session.user;

      return [].concat(email.to || [], email.cc || [], email.bcc || []).filter(function(recipient) {
        return recipient.email !== getEmailAddress(sender);
      });
    }

    function getReplyToRecipients(email) {
      const replyTo = _.reject(email.replyTo, { email: jmapDraft.EMailer.unknown().email });

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

    function getReplyRecipients(email, sender) {
      function notMe(item) {
        return item.email !== getEmailAddress(sender);
      }

      function replyTo() {
        if (email.from.email !== session.user.preferredEmail) {
          return getReplyToRecipients(email);
        }

        return _(email.to || []).concat(getReplyToRecipients(email)).uniq('email').value().filter(notMe);
      }

      if (!email || !sender) {
        return;
      }

      return {
        to: replyTo(),
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

      email.mappingsUrlAndCid.forEach(function(mapping) {
        email.htmlBody = email.htmlBody.replace(mapping.url, 'cid:' + mapping.cid);
      });

      delete email.mappingsUrlAndCid;

      return email;
    }

    function _addReferenceToOriginalMessage(referencedMessageIdsHeaderName, parentMessage) {
      if (!parentMessage.headers || !referencedMessageIdsHeaderName) {
        return;
      }
      const quotedId = parentMessage.headers['Message-ID'],
        parentReferences = parentMessage.headers.References || '',
        parentReferencesAsArray = parentReferences && parentReferences.split(' ')
          .map(Function.prototype.call, String.prototype.trim).filter(Boolean),
        newHeaders = { References: [].concat(parentReferencesAsArray, [quotedId]).filter(Boolean).join(' ') };

      newHeaders[referencedMessageIdsHeaderName] = parentMessage.headers['Message-ID'];

      return newHeaders;
    }

    function _createQuotedEmail(opts, messageId, sender) {
      return $q.when(inboxMessagesCache[messageId] || inboxJmapDraftHelper.getMessageById(messageId)).then(function(message) {
        if (message.htmlBody) {
          message.htmlBody = htmlCleaner.clean(message.htmlBody);
        }

        const newRecipients = opts.recipients ? opts.recipients(message, sender) : {},
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

        const handleAttachment = opts.includeAttachments ?
          _handleAttachmentInQuoteOfForwardMail : _handleAttachmentInQuoteOfReplyMail;

        return handleAttachment(message, newEmail)
          .then(function() {
            // We do not automatically quote the message if we're using a plain text editor and the message
            // has a HTML body. In this case the "Edit Quoted Mail" button will show
            if (!emailBodyService.supportsRichtext() && message.htmlBody) {
              return emailBodyService.quote(newEmail, opts.templateName, true).then(function(body) {
                newEmail.quoted.htmlBody = body;

                return newEmail;
              });
            }

            return emailBodyService.quote(newEmail, opts.templateName)
              .then(function(body) {
                return _enrichWithQuote(newEmail, body);
              });
          });
      });
    }

    function _handleAttachmentInQuoteOfForwardMail(message, newEmail) {
      if (!message.attachments || !message.attachments.length) {
        return $q.when();
      }

      const inlineAttachments = _getInlineAttachments(message.attachments);
      const nonInlineAttachments = message.attachments.filter(function(attachment) {
        return !attachment.isInline;
      });

      newEmail.attachments = [];

      if (nonInlineAttachments.length) {
        nonInlineAttachments.forEach(function(attachment) {
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

      const inlineAttachments = _getInlineAttachments(message.attachments);

      if (!inlineAttachments.length) {
        return $q.when();
      }

      newEmail.attachments = [];

      return _handleInlineAttachment(newEmail, inlineAttachments);
    }

    function _handleInlineAttachment(newEmail, attachments) {
      const inlineCids = _getCidFromImageSources(newEmail.quoted.htmlBody);

      attachments.forEach(function(attachment) {
        newEmail.attachments.push(attachment);
      });

      return _getInlineImageMappingsUrlAndCid(inlineCids, attachments)
        .then(function(mappings) {
          newEmail.mappingsUrlAndCid = mappings;
          mappings.forEach(function(mapping) {
            newEmail.quoted.htmlBody = newEmail.quoted.htmlBody.replace('cid:' + mapping.cid, mapping.url);
          });
        });
    }

    function _getInlineAttachments(attachments) {
      return attachments.filter(function(attachment) {
        return attachment.isInline;
      });
    }

    function _getCidFromImageSources(messageBody) {
      const document = new DOMParser().parseFromString(messageBody, 'text/html');
      const elements = document.getElementsByTagName('img');

      // elements is a HTMLCollection and isn't a 'true' array,
      // elements doesn't have 'forEach', 'map' function like an array. Therefore, we have to convert it to array.
      return [].map.call(elements, function(element) {
        const cidMatch = element &&
          element.src &&
          element.src.match(/^cid:(\S+)/);

        return cidMatch && cidMatch[1];
      }).filter(Boolean);
    }

    function _getInlineImageMappingsUrlAndCid(cids, attachments) {
      const mappingPromises = [];

      cids.forEach(function(cid) {
        const inlineAttachment = _.find(attachments, function(attachment) {
          return attachment.cid === cid;
        });

        if (inlineAttachment && inlineAttachment.getSignedDownloadUrl) {
          mappingPromises.push(inlineAttachment.getSignedDownloadUrl().then(function(url) {
            return { url: url, cid: inlineAttachment.cid };
          }));
        }
      });

      return mappingPromises.length > 0 ? $q.all(mappingPromises) : $q.when([]);
    }
  });
