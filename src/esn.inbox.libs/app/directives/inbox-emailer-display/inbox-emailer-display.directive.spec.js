'use strict';

/* global chai, _: false */

const { expect } = chai;

describe('The inboxEmailerDisplay directive', function() {
  let $compile, $rootScope, $scope, element, email;

  function compileDirective(html, data) {
    element = angular.element(html);
    element.appendTo(document.body);

    if (data) {
      Object.keys(data).forEach(function(key) {
        element.data(key, data[key]);
      });
    }

    $compile(element)($scope);
    $scope.$digest();

    return element;
  }

  const tokenAPIMock = {
    getWebToken() {
      return $q.when({ data: 'jwt' });
    }
  };

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('tokenAPI', tokenAPIMock);
    });
  });

  beforeEach(function() {
    angular.mock.module('esn.inbox.libs');
  });

  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  beforeEach(function() {
    $scope = $rootScope.$new();
  });

  beforeEach(function() {
    email = {
      from: { name: 'Bob', email: 'bob@email', resolve: angular.noop },
      to: [{ name: 'Alice', email: 'alice@email', resolve: angular.noop }],
      cc: [{ name: 'Clark', email: 'clark@email', resolve: angular.noop }],
      bcc: [{ name: 'John', email: 'john@email', resolve: angular.noop }]
    };
  });

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  it('should initialize by exposing scope attributes properly', function() {
    $scope.email = email;
    compileDirective('<inbox-emailer-display email="email" />');

    var isolateScope = element.isolateScope();

    expect(isolateScope.previewEmailer).to.deep.equal(email.to[0]);
    expect(isolateScope.previewEmailerGroup).to.deep.equal('To');
    expect(isolateScope.numberOfHiddenEmailer).to.equal(2);
    expect(isolateScope.showMoreButton).to.equal(true);
  });

  it('should display the first "To" recipient', function() {
    $scope.email = email;

    compileDirective('<inbox-emailer-display email="email" />');

    var isolateScope = element.isolateScope();

    expect(isolateScope.previewEmailer.email).to.deep.equal('alice@email');
    expect(isolateScope.previewEmailerGroup).to.deep.equal('To');
  });

  it('should display the first "CC" recipient', function() {
    $scope.email = _.omit(email, 'to');

    compileDirective('<inbox-emailer-display email="email" />');

    var isolateScope = element.isolateScope();

    expect(isolateScope.previewEmailer.email).to.deep.equal('clark@email');
    expect(isolateScope.previewEmailerGroup).to.deep.equal('CC');
  });

  it('should display the first "BCC" recipient', function() {
    $scope.email = _.omit(email, 'to', 'cc');

    compileDirective('<inbox-emailer-display email="email" />');

    var isolateScope = element.isolateScope();

    expect(isolateScope.previewEmailer.email).to.deep.equal('john@email');
    expect(isolateScope.previewEmailerGroup).to.deep.equal('BCC');
  });

  it('should be collapsed by default', function() {
    $scope.email = email;
    compileDirective('<inbox-emailer-display email="email" />');

    expect(element.find('.recipients .collapsed, .more .collapsed').length).to.equal(2);
    expect(element.find('.recipients .expanded, .more .expanded').length).to.equal(0);
  });

  it('should be expanded after a click on more button then collapsed when click again', function() {
    $scope.email = email;
    compileDirective('<inbox-emailer-display email="email" />');

    element.find('.more').click();

    expect(element.find('.recipients .collapsed, .more .collapsed').length).to.equal(0);
    expect(element.find('.recipients .expanded, .more .expanded').length).to.equal(2);

    element.find('.more').click();

    expect(element.find('.recipients .collapsed, .more .collapsed').length).to.equal(2);
    expect(element.find('.recipients .expanded, .more .expanded').length).to.equal(0);
  });

  it('should not show more button when there is only 1 recipient', function() {
    $scope.email = {
      from: { name: 'Bob', email: 'bob@email', resolve: angular.noop },
      to: [{ name: 'Alice', email: 'alice@email', resolve: angular.noop }],
      cc: []
    };
    compileDirective('<inbox-emailer-display email="email" />');

    expect(element.find('.more').css('display')).to.equal('none');
  });

  it('should show both name and email if there is only 1 recipient and it is not current user', function() {
    $scope.email = {
      from: { name: 'Bob', email: 'bob@email', resolve: angular.noop },
      to: [{ name: 'Alice', email: 'alice@email', resolve: angular.noop }],
      cc: []
    };

    compileDirective('<inbox-emailer-display email="email" />');

    expect(element.find('.to').html()).to.contain(email.to[0].name);
    expect(element.find('.to').html()).to.contain(email.to[0].email);
  });

  it('should not display any recipients if there is no recipients', function() {
    $scope.email = _.omit(email, 'to', 'cc', 'bcc');

    compileDirective('<inbox-emailer-display email="email" />');

    expect(element.find('.recipients .collapsed').length).to.equal(0);
    expect(element.find('.recipients .expanded').length).to.equal(0);
  });

});
