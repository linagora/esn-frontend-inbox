angular.module('esn.test.injector', []).run(function($q) {
  window.$q = $q;
});

beforeEach(function() {
  window.$q = angular.injector(['ng']).get('$q');
  angular.mock.module('esn.test.injector');
});
