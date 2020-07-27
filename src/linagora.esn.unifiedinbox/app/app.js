(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox', [
    'restangular',
    'ngTagsInput',
    'esn.router',
    'angularMoment',
    'esn.notification',
    'esn.iframe-resizer-wrapper',
    'esn.file',
    'esn.box-overlay',
    'esn.profile',
    'esn.summernote-wrapper',
    'esn.attendee',
    'esn.fullscreen-edit-form',
    'esn.scroll',
    'op.dynamicDirective',
    'esn.header',
    'esn.offline-wrapper',
    'esn.lodash-wrapper',
    'esn.settings-overlay',
    'esn.desktop-utils',
    'esn.form.helper',
    'esn.infinite-list',
    'esn.url',
    'esn.background',
    'esn.aggregator',
    'esn.provider',
    'esn.dragndrop',
    'esn.autolinker-wrapper',
    'esn.configuration',
    'esn.core',
    'linagora.esn.graceperiod',
    'ngAnimate',
    'esn.escape-html',
    'esn.cache',
    'esn.search',
    'esn.async-action',
    'esn.user',
    'esn.session',
    'esn.attachment-list',
    'esn.avatar',
    'esn.highlight',
    'esn.registry',
    'material.components.virtualRepeat',
    'esn.module-registry',
    'esn.user-configuration',
    'esn.ui',
    'ng.deviceDetector',
    'esn.datetime',
    'esn.i18n',
    'esn.http',
    'esn.shortcuts',
    'esn.promise',
    'esn.people',
    'esn.actionList',
    'esn.previous-page',
    'esn.touchscreen-detector',
    'esn.dropdownList',
    'material.components.button',
    'material.components.menu',
    'material.components.icon',
    'material.components.menuBar',
    'esn.attachments-selector',
    'linagora.esn.james',
    'esn.inbox.libs',
    angularDragula(angular) // eslint-disable-line no-undef
  ]);
})(angular);

require('../../esn.inbox.libs/app/app.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/esn.router.js');
require('esn-frontend-common-libs/src/frontend/js/modules/notification.js');
require('esn-frontend-common-libs/src/frontend/js/modules/iframe-resizer-wrapper.js');
require('esn-frontend-common-libs/src/frontend/js/modules/file.js');
require('esn-frontend-common-libs/src/frontend/js/modules/box-overlay/box-overlay.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/profile.js');
require('esn-frontend-common-libs/src/frontend/js/modules/esn.summernote.js');
require('esn-frontend-common-libs/src/frontend/js/modules/attendee/attendee.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/fullscreen-edit-form.js');
require('esn-frontend-common-libs/src/frontend/js/modules/scroll.js');
require('esn-frontend-common-libs/src/frontend/js/modules/header/header.js');
require('esn-frontend-common-libs/src/frontend/js/modules/esn.offline.js');
require('esn-frontend-common-libs/src/frontend/js/modules/lodash-wrapper.js');
require('esn-frontend-common-libs/src/frontend/js/modules/settings-overlay.js');
require('esn-frontend-common-libs/src/frontend/js/modules/desktop-utils.js');
require('esn-frontend-common-libs/src/frontend/js/modules/form-helper/form-helper.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/infinite-list/infinite-list.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/url.js');
require('esn-frontend-common-libs/src/frontend/js/modules/background.js');
require('esn-frontend-common-libs/src/frontend/js/modules/aggregator.js');
require('esn-frontend-common-libs/src/frontend/js/modules/provider.js');
require('esn-frontend-common-libs/src/frontend/js/modules/dragndrop.js');
require('esn-frontend-common-libs/src/frontend/js/modules/esn.autolinker-wrapper.js');
require('esn-frontend-common-libs/src/frontend/js/modules/config/config.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/core.js');
require('esn-frontend-common-libs/src/frontend/js/modules/escape-html.js');
require('esn-frontend-common-libs/src/frontend/js/modules/cache.js');
require('esn-frontend-common-libs/src/frontend/js/modules/search/search.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/async-action.js');
require('esn-frontend-common-libs/src/frontend/js/modules/user/user.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/session.js');
require('esn-frontend-common-libs/src/frontend/js/modules/attachment/list/attachment-list.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/avatar.js');
require('esn-frontend-common-libs/src/frontend/js/modules/highlight.js');
require('esn-frontend-common-libs/src/frontend/js/modules/registry.js');
require('esn-frontend-common-libs/src/frontend/js/modules/module-registry/module-registry.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/user-configuration/user-configuration.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/ui.js');
require('esn-frontend-common-libs/src/frontend/js/modules/datetime/datetime.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/i18n/i18n.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/shortcuts/shortcuts.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/promise/promise.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/people/people.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/http.js');
require('esn-frontend-common-libs/src/frontend/js/modules/attachments-selector/attachments-selector.module.js');
require('esn-frontend-common-libs/src/modules/linagora.esn.graceperiod/frontend/js/app.js');
require('esn-frontend-common-libs/src/frontend/js/modules/action-list');
require('esn-frontend-common-libs/src/frontend/js/modules/touchscreen-detector');
require('esn-frontend-common-libs/src/frontend/js/modules/previous-page');
require('esn-frontend-common-libs/src/frontend/js/modules/dropdown-list');


require ('./components/attachment-alternative-uploader/attachment-alternative-uploader-modal.controller.js');
require ('./components/attachment-alternative-uploader/attachment-alternative-uploader-modal.service.js');
require ('./components/banner/quota-banner/quota-banner.component.js');
require ('./components/banner/quota-banner/quota-banner.controller.js');
require ('./components/banner/vacation-banner/vacation-banner.component.js');
require ('./components/banner/vacation-banner/vacation-banner.controller.js');
require ('./components/composer/attachments-selector/composer-attachments-selector.js');
require ('./components/composer/attachments/composer-attachments.controller.js');
require ('./components/composer/attachments/composer-attachments.js');
require ('./components/composer/body-editor/html/composer-body-editor-html.controller.js');
require ('./components/composer/body-editor/html/composer-body-editor-html.js');
require ('./components/composer/body-editor/text/composer-body-editor-text.controller.js');
require ('./components/composer/body-editor/text/composer-body-editor-text.js');
require ('./components/composer/boxed/composer-boxed.js');
require ('./components/composer/composer.controller.js');
require ('./components/composer/composer.js');
require ('./components/composer/identity-selector/composer-identity-selector.controller.js');
require ('./components/composer/identity-selector/composer-identity-selector.js');
require ('./components/composer/mobile/composer-mobile.controller.js');
require ('./components/composer/mobile/composer-mobile.js');
require ('./components/config/disable-forwarding/inbox-config-form-disable-forwarding.controller.js');
require ('./components/config/disable-local-copy/inbox-config-form-disable-local-copy.controller.js');
require ('./components/config/inbox-config-form.component.js');
require ('./components/config/inbox-config-form.constants.js');
require ('./components/config/inbox-config-form.controller.js');
require ('./components/inbox-configuration/configuration.component.js');
require ('./components/inbox-configuration/configuration.controller.js');
require ('./components/inbox-configuration/filter-definition/configuration-filter-definition.component.js');
require ('./components/inbox-configuration/filter-definition/configuration-filter-definition.controller.js');
require ('./components/inbox-configuration/filter-definition/subheader/filter-definition-subheader.js');
require ('./components/inbox-configuration/filters/configuration-filters.component.js');
require ('./components/inbox-configuration/filters/configuration-filters.controller.js');
require ('./components/inbox-configuration/filters/filter-card/configuration-filter-card.component.js');
require ('./components/inbox-configuration/filters/filter-card/configuration-filter-card.controller.js');
require ('./components/inbox-configuration/filters/subheader/filters-subheader.js');
require ('./components/inbox-configuration/forwardings/form/inbox-forwardings-form.component.js');
require ('./components/inbox-configuration/forwardings/form/inbox-forwardings-form.controller.js');
require ('./components/inbox-configuration/forwardings/inbox-forwardings.component.js');
require ('./components/inbox-configuration/forwardings/inbox-forwardings.controller.js');
require ('./components/inbox-configuration/forwardings/subheader/inbox-forwardings-subheader.component.js');
require ('./components/inbox-configuration/forwardings/user/inbox-forwardings-user.component.js');
require ('./components/inbox-configuration/forwardings/user/inbox-forwardings-user.controller.js');
require ('./components/inbox-configuration/forwardings/user/inbox-forwardings-user.run.js');
require ('./components/inbox-configuration/read-receipt/read-receipt.component.js');
require ('./components/inbox-configuration/read-receipt/read-receipt.controller.js');
require ('./components/inbox-configuration/read-receipt/request-receipts/request-receipts.controller.js');
require ('./components/inbox-configuration/read-receipt/request-receipts/request-receipts.js');
require ('./components/inbox-configuration/read-receipt/request-receipts/subheader/request-receipts-subheader.js');
require ('./components/list/group-toggle-selection/list-group-toggle-selection.controller.js');
require ('./components/list/group-toggle-selection/list-group-toggle-selection.js');
require ('./components/list/header/list-header.controller.js');
require ('./components/list/header/list-header.js');
require ('./components/list/refresh-button/refresh-button.js');
require ('./components/mailbox-shared-settings/mailbox-shared-settings.component.js');
require ('./components/mailbox-shared-settings/mailbox-shared-settings.controller.js');
require ('./components/mailbox-shared-settings/owner/mailbox-shared-settings-owner.component.js');
require ('./components/mailbox-shared-settings/user/mailbox-shared-settings-user.component.js');
require ('./components/message-body/html/message-body-html.controller.js');
require ('./components/message-body/html/message-body-html.js');
require ('./components/message-body/message-body.js');
require ('./components/message-body/text/message-body-text.js');
require ('./components/preferences/general/inbox-preferences-mailto.controller.js');
require ('./components/preferences/general/inbox-preferences-mailto.js');
require ('./components/preferences/general/inbox-preferences-mailto.run.js');
require ('./components/shared-mailboxes/shared-mailbox/shared-mailbox.component.js');
require ('./components/shared-mailboxes/shared-mailboxes.component.js');
require ('./components/shared-mailboxes/shared-mailboxes.controller.js');
require ('./components/shared-mailboxes/subheader/shared-mailboxes-subheader.js');
require ('./components/sidebar/attachment-button/sidebar-attachment-button.component.js');
require ('./components/sidebar/attachment/sidebar-attachment.component.js');
require ('./components/sidebar/attachment/sidebar-attachment.controller.js');
require ('./components/sidebar/folder-settings/folder-settings.component.js');
require ('./components/sidebar/folder-settings/folder-settings.controller.js');
require ('./components/sidebar/unifiedinbox-button/unifiedinbox-button.component.js');
require ('./components/subheader/delete-button/subheader-delete-button.js');
require ('./components/subheader/mark-as-read-button/subheader-mark-as-read-button.js');
require ('./components/subheader/mark-as-unread-button/subheader-mark-as-unread-button.js');
require ('./components/subheader/more-button/subheader-more-button.js');
require ('./components/subheader/not-spam-button/subheader-not-spam-button.js');
require ('./components/user-quota/user-quota.controller.js');
require ('./components/user-quota/user-quota.js');
require ('./config.js');
require ('./controllers.js');
require ('./directives/attachment-drag-and-drop-handler.js');
require ('./directives/dragula-disable-scroll-on.js');
require ('./directives/lists.js');
require ('./directives/main.js');
require ('./directives/sidebar.js');
require ('./directives/subheaders.js');
require ('./filters.js');
require ('./filters/filter-descendant-mailboxes.js');
require ('./filters/item-date.js');
require ('./filters/quote/quote.js');
require ('./filters/sanitize-stylised-html-filter.js');
require ('./filters/visible-shared-mailboxes.js');
require ('./module-registry.run.js');
require ('./providers.js');
require ('./routes.js');
require ('./run.js');
require ('./search/form/search-form.component.js');
require ('./search/form/search-form.controller.js');
require ('./search/message-list-item/message-list-item.controller.js');
require ('./search/message-list-item/message-list-item.directive.js');
require ('./search/plugin/search-plugin.run.js');
require ('./search/plugin/search-plugin.service.js');
require ('./search/provider/local-search-provider.service.js');
require ('./search/provider/search-results-provider.service.js');
require ('./search/provider/search-submit.service.js');
require ('./search/search-query.run.js');
require ('./search/search.constants.js');
require ('./search/search.run.js');
require ('./services.js');
require ('./services/attachment-jmap/attachment-jmap.constants.js');
require ('./services/attachment-jmap/attachment-jmap.run.js');
require ('./services/attachment-jmap/attachment-jmap.service.js');
require ('./services/attachment-provider-registry/attachment-provider-registry.service.js');
require ('./services/attachment-upload/inbox-attachment-upload.service.js');
require ('./services/common/inbox-utils.service.js');
require ('./services/config/config.js');
require ('./services/custom-role-mailbox/custom-role-mailbox.service.js');
require ('./services/draft/draft.js');
require ('./services/email-body/email-body.js');
require ('./services/email-resolver/inbox-email-resolver.service.js');
require ('./services/filtered-list/filtered-list.js');
require ('./services/filtering/filtering-service.js');
require ('./services/filtering/filters.js');
require ('./services/forwardings/inbox-forwardings-api-client.service.js');
require ('./services/forwardings/inbox-forwardings.service.js');
require ('./services/generate-jwt-token/generate-jwt-token.js');
require ('./services/hook/email-composing-hook.service.js');
require ('./services/hook/email-sending-hook.service.js');
require ('./services/identities/inbox-identities.service.js');
require ('./services/identities/inbox-users-identities-api-client.service.js');
require ('./services/jmap-client-provider/jmap-client-provider.js');
require ('./services/jmap-client-provider/jmap-client-provider.run.js');
require ('./services/jmap-client-wrapper/jmap-client-wrapper.service.js');
require ('./services/jmap-helper/jmap-helper.js');
require ('./services/jmap-item/jmap-item-service.js');
require ('./services/mailboxes-filter/mailboxes-filter-service.constants.js');
require ('./services/mailboxes-filter/mailboxes-filter-service.js');
require ('./services/mailboxes/mailboxes-service.js');
require ('./services/mailboxes/permissions-service.constants.js');
require ('./services/mailboxes/permissions-service.js');
require ('./services/mailboxes/shared-mailboxes.constants.js');
require ('./services/mailboxes/shared-mailboxes.js');
require ('./services/mailboxes/special-mailboxes.constants.js');
require ('./services/mailboxes/special-mailboxes.js');
require ('./services/mailboxes/special-mailboxes.run.js');
require ('./services/mailto-parser/mailto-parser.js');
require ('./services/models/emailer.run.js');
require ('./services/models/emailer.service.js');
require ('./services/models/mailbox.run.js');
require ('./services/models/make-selectable.js');
require ('./services/models/message.run.js');
require ('./services/models/thread.run.js');
require ('./services/new-composer/new-composer.js');
require ('./services/plugins/jmap/jmap-plugin.run.js');
require ('./services/plugins/plugins.js');
require ('./services/request-receipts/request-receipts-service.js');
require ('./services/request-receipts/request-receipts.constants.js');
require ('./services/selection/selection.service.js');
require ('./services/shortcuts/shortcuts.constants.js');
require ('./services/shortcuts/shortcuts.run.js');
require ('./services/user-quota/user-quota-service.constants.js');
require ('./services/user-quota/user-quota-service.js');
require ('./services/with-jmap-client/with-jmap-client.js');
