(function(angular) {
  'use strict';

  angular.module('esn.inbox.libs')

    .constant('INBOX_MODULE_NAME', 'linagora.esn.unifiedinbox')
    .constant('MAILBOX_ROLE_ICONS_MAPPING', {
      default: 'mdi mdi-email',
      inbox: 'mdi mdi-inbox-arrow-down',
      archive: 'mdi mdi-archive',
      drafts: 'mdi mdi-file-document',
      outbox: 'mdi mdi-inbox-arrow-up',
      sent: 'mdi mdi-send',
      trash: 'mdi mdi-delete',
      spam: 'mdi mdi-alert-decagram',
      templates: 'mdi mdi-clipboard-text'
    })
    .constant('INBOX_AVATAR_SIZE', 65)
    .constant('INBOX_CACHE_TTL', 60 * 60 * 1000) // 1 hour
    .constant('INBOX_AUTOCOMPLETE_LIMIT', 20)
    .constant('INBOX_AUTOCOMPLETE_OBJECT_TYPES', ['user', 'contact', 'group', 'ldap'])
    .constant('INBOX_DISPLAY_NAME_SIZE', 100)
    .constant('MAILBOX_LEVEL_SEPARATOR', ' / ')
    .constant('JMAP_GET_MESSAGES_LIST', ['id', 'blobId', 'threadId', 'headers', 'subject', 'from', 'to', 'cc', 'bcc', 'replyTo', 'preview', 'date', 'isUnread', 'isFlagged', 'isDraft', 'hasAttachment', 'mailboxIds', 'isAnswered', 'isForwarded'])
    .constant('JMAP_GET_MESSAGES_VIEW', ['id', 'blobId', 'threadId', 'headers', 'subject', 'from', 'to', 'cc', 'bcc', 'replyTo', 'preview', 'textBody', 'htmlBody', 'date', 'isUnread', 'isFlagged', 'isDraft', 'hasAttachment', 'attachments', 'mailboxIds'])
    .constant('JMAP_GET_MESSAGES_ATTACHMENTS_LIST', ['id', 'blobId', 'threadId', 'subject', 'date', 'hasAttachment', 'attachments', 'mailboxIds'])
    .constant('ATTACHMENTS_ATTRIBUTES', ['blobId', 'isInline', 'name', 'size', 'type'])
    .constant('DEFAULT_MAX_SIZE_UPLOAD', 20971520)
    .constant('DRAFT_SAVING_DEBOUNCE_DELAY', 1000)
    .constant('INBOX_DEFAULT_NUMBER_ITEMS_PER_PAGE_ON_BULK_READ_OPERATIONS', 30)
    .constant('INBOX_DEFAULT_NUMBER_ITEMS_PER_PAGE_ON_BULK_DELETE_OPERATIONS', 30)
    .constant('INBOX_DEFAULT_NUMBER_ITEMS_PER_PAGE_ON_BULK_UPDATE_OPERATIONS', 30)
    .constant('DEFAULT_VIEW', 'messages')
    .constant('INBOX_DEFAULT_MAILBOX_NAMES', {
      INBOX: 'INBOX'
    })
    .constant('INBOX_MESSAGE_HEADERS', {
      READ_RECEIPT: 'Disposition-Notification-To',
      REPLY_TO: 'In-Reply-To',
      FORWARD: 'X-Forwarded-Message-Id'
    })
    .constant('INBOX_SWIPE_DURATION', 500)
    .constant('PROVIDER_TYPES', {
      JMAP: 'jmap',
      SOCIAL: 'social',
      SEARCH: 'search'
    })
    .constant('INBOX_EVENTS', {
      VACATION_STATUS: 'inbox:vacationStatusUpdated',
      FILTER_CHANGED: 'inbox:filterChanged',
      FILTER_SOCIAL_CHANGED: 'inbox:filterSocialChanged',
      ITEM_SELECTION_CHANGED: 'inbox:itemSelectionChanged',
      ITEM_FLAG_CHANGED: 'inbox:itemFlagChanged',
      ITEM_MAILBOX_IDS_CHANGED: 'inbox:itemMailboxIdsChanged',
      BADGE_LOADING_ACTIVATED: 'inbox:badgeLoadingActivated',
      UNAVAILABLE_ACCOUNT_DETECTED: 'inbox:unavailableAccountDetected',
      DRAFT_DESTROYED: 'inbox:draftDestroyed',
      DRAFT_CREATED: 'inbox:draftCreated',
      PERSONAL_FOLDERS_UPDATED: 'inbox:personalFoldersUpdated',
      SHARED_FOLDERS_UPDATED: 'inbox:sharedFoldersUpdated'
    })
    .constant('INBOX_SUMMERNOTE_OPTIONS', {
      focus: false,
      airMode: false,
      disableResizeEditor: true,
      toolbar: [
        ['style', ['style']],
        ['color', ['color']],
        ['font', ['bold', 'italic', 'underline', 'strikethrough']],
        ['alignment', ['paragraph', 'ul', 'ol']]
      ],
      keyMap: {
        pc: {'CTRL+ENTER': '', ENTER: 'insertParagraph'},
        mac: {'CMD+ENTER': '', ENTER: 'insertParagraph'}
      }
    })
    .constant('INBOX_CONTROLLER_LOADING_STATES', {
      LOADING: 'LOADING',
      LOADED: 'LOADED',
      ERROR: 'ERROR'
    })
    .constant('INBOX_MODULE_METADATA', {
      id: 'linagora.esn.unifiedinbox',
      title: 'Unified Inbox',
      icon: '/unifiedinbox/images/inbox-icon.svg',
      homePage: 'unifiedinbox',
      config: {
        template: 'inbox-config-form',
        displayIn: {
          user: false,
          domain: true,
          platform: true
        }
      },
      disableable: true,
      isDisplayedByDefault: true
    })
    .constant('INBOX_SIGNATURE_SEPARATOR', '-- \n'); // https://tools.ietf.org/html/rfc3676#section-4.3
})(angular);
