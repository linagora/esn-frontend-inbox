'use strict';

const _ = require('lodash');

angular.module('linagora.esn.unifiedinbox').directive('attachmentDragAndDropHandler', attachmentDragAndDropHandler);

function attachmentDragAndDropHandler($compile, esnI18nService) {
  return {
    restrict: 'A',
    scope: { attachmentUploadCallback: '&attachmentDragAndDropHandler' },
    link: function(scope, elmt) {
      var eventDefinitions = [
        [elmt[0], 'dragover', cancel],
        [document, 'dragenter', onDragStart],
        [document, 'dragleave', onDragStop],
        [document, 'drop', onGlobalDrop],
        [elmt[0], 'dragover', onDragEnter],
        [elmt[0], 'dragleave', onDragLeave],
        [elmt[0], 'drop', onElementDrop]
      ];

      _init();

      var dragzoneHelpText = elmt.find('.esn-dragzone-help-text');
      var collection = [];

      function cancel(evt) {
        evt.preventDefault();
      }

      function onDragStart(evt) {
        cancel(evt);
        dragzoneHelpText.css({ height: elmt.height() });
        scope.isHelpTextVisible = true;
        collection.push(evt.target);
      }

      function onDragStop(evt) {
        cancel(evt);
        collection = _.without(collection, evt.target);
        if (!collection.length) {
          scope.isHelpTextVisible = false;
        }
      }

      function onGlobalDrop(evt) {
        cancel(evt);
        collection.length = 0;
        scope.isHelpTextVisible = false;
      }

      function onDragEnter(evt) {
        cancel(evt);
        scope.helpText = esnI18nService.translate('Drop files here').toString();
        elmt.addClass('esn-dragzone-hover');
      }

      function onDragLeave(evt) {
        cancel(evt);
        scope.helpText = esnI18nService.translate('Drag files here').toString();
        elmt.removeClass('esn-dragzone-hover');
      }

      function onElementDrop(evt) {
        cancel(evt);

        var attachments = [];

        for (var i = evt.dataTransfer.files.length; i-- > 0;) {
          attachments.push(evt.dataTransfer.files.item(i));
        }

        scope.attachmentUploadCallback({ attachments: attachments });
      }

      function _init() {
        _defineInScope('isHelpTextVisible', false);
        _defineInScope('helpText', 'Drag files here');

        elmt.addClass('esn-dragzone');
        var template = '<div class="esn-dragzone-help-text" ng-show="isHelpTextVisible">{{ helpText }}</div>';

        angular.element($compile(template)(scope)).appendTo(elmt);

        _processEventDefinitions('addEventListener');
        scope.$on('$destroy', _.partial(_processEventDefinitions, 'removeEventListener'));
      }

      function _processEventDefinitions(eventListenerAction) {
        eventDefinitions.forEach(function(eventDefinition) {
          var element = eventDefinition[0];
          var event = eventDefinition[1];
          var callback = eventDefinition[2];

          element[eventListenerAction](event, callback);
        });
      }

      function _defineInScope(name, initialValue) {
        var hiddenName = '_' + name;

        scope[hiddenName] = initialValue;

        Object.defineProperty(scope, name, {
          get: function() {
            return scope[hiddenName];
          },
          set: function(value) {
            if (scope[hiddenName] !== value) {
              scope[hiddenName] = value;
              scope.$apply();
            }
          }
        });
      }
    }
  };
}
