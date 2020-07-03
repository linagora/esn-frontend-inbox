(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .constant('JMAP_FILTER', {
      CONDITIONS: {
        FROM: {
          JMAP_KEY: 'from',
          HUMAN_REPRESENTATION: 'is from %s'
        },
        TO: {
          JMAP_KEY: 'to',
          HUMAN_REPRESENTATION: 'is addressed to %s'
        },
        CC: {
          JMAP_KEY: 'cc',
          HUMAN_REPRESENTATION: 'is cc\'d to %s'
        },
        RECIPIENT: {
          JMAP_KEY: 'recipient',
          HUMAN_REPRESENTATION: 'is addressed or cc\'d to %s'
        },
        SUBJECT: {
          JMAP_KEY: 'subject',
          HUMAN_REPRESENTATION: 'has subject containing %s'
        }
      },
      CONDITIONS_MAPPING: {
        from: 'FROM',
        to: 'TO',
        cc: 'CC',
        recipient: 'RECIPIENT',
        subject: 'SUBJECT'
      },
      ACTIONS: {
        MOVE_TO: {
          JMAP_KEY: 'appendIn',
          HUMAN_REPRESENTATION: 'move to destination folder %s'
        }
      },
      ACTIONS_MAPPING: {
        appendIn: 'MOVE_TO'
      }
    });
})();
