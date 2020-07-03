(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .constant('INBOX_PERSONAL_MAILBOX_NAMESPACE_TYPE', 'personal')

    .constant('INBOX_MAILBOX_SHARING_ROLES', {
      READ_AND_UPDATE: 'READ_AND_UPDATE',
      READ_AND_UPDATE_LABEL: 'Consultation',
      READ_AND_UPDATE_LABEL_LONG: 'Read and update messages',

      ORGANIZE: 'ORGANIZE',
      ORGANIZE_LABEL: 'Organize',
      ORGANIZE_LABEL_LONG: 'Consultation and organize folder'
    })

    // cf IMAP ACL Extension https://tools.ietf.org/html/rfc4314#section-2.1
    .constant('INBOX_MAILBOX_SHARING_PERMISSIONS', {
      READ_AND_UPDATE: ['l', 'r', 'w'],
      ORGANIZE: ['l', 'r', 'w', 'i', 'e', 't']
    });
})();
