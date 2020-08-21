'use strict';

angular.module('linagora.esn.unifiedinbox')
  .constant('INBOX_CONFIG_EVENTS', {
    DISABLE_FORWARDING_CANCELLED: 'inbox:config:disableForwardingCancelled',
    DISABLE_LOCAL_COPY_CANCELLED: 'inbox:config:disableLocalCopyCancelled'
  });
