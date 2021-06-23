'use strict';

require('../../services.js');

angular.module('linagora.esn.unifiedinbox').factory('inboxEmailerResolver', inboxEmailerResolver);

/**
 * Resolve people from email
 * If the resolved object type is "user", we use name in email FROM field instead of resolved display name
 */
function inboxEmailerResolver(esnAvatarUrlService, INBOX_AVATAR_SIZE) {
  return function() {
    var self = this;

    self.objectType = 'email';
    self.avatarUrl = esnAvatarUrlService.generateUrl(self.email, self.name);

    return Promise.resolve({
      id: false,
      email: self.email,
      url: addSize(self.avatarUrl, INBOX_AVATAR_SIZE)
    });
  };

  function addSize(avatarUrl, size) {
    return avatarUrl.split('?').length > 1 ? avatarUrl + '&size=' + size : avatarUrl + '?size=' + size;
  }
}
