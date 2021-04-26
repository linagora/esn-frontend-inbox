/*
Experiments is a static array of features that are currently under development,
and for which we want to provide a earlybird access to users.

Example:

[
  {
    key: 'inbox.experiment.fancy-attachments',
    title: 'New attachment display',
    description: 'In mail view, the new attachments display allows to preview images'
  },
  {
    key: 'inbox.experiment.event-partstat-in-email-list',
    title: 'Reply to meeting invitation from the email list',
    description: 'In email list view, when you hover your mouse over an email that is a meeting request, you can directly set your participation status to "I will attend", "Maybe" or "I will not attend".'
  }
]

*/

const experiments = [
  {
    key: 'inbox.experiment.tree-folders',
    title: 'Tree folder display',
    description: 'In sidebar view, folders display are list with a tree view.'
  }
];

angular.module('linagora.esn.unifiedinbox')
  .constant('inboxExperimentList', experiments.map(experiment => ({ ...experiment, active: false })));
