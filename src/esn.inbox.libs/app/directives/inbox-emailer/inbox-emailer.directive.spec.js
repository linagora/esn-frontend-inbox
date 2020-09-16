'use strict';

/* global chai, sinon: false */

const { expect } = chai;

describe('The inboxEmailer directive', function() {

  let $compile, $rootScope, $scope, element, session;

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

  beforeEach(angular.mock.inject(function(_session_) {
    session = _session_;
  }));

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  it('should resolve the emailer', function() {
    $scope.emailer = {
      resolve: sinon.spy()
    };

    compileDirective('<inbox-emailer emailer="emailer"/>');

    expect($scope.emailer.resolve).to.have.been.calledWith();
  });

  it('should resolve the emailer when it becomes available', function() {
    compileDirective('<inbox-emailer emailer="emailer"/>');

    $scope.emailer = {
      resolve: sinon.spy()
    };
    $scope.$digest();

    expect($scope.emailer.resolve).to.have.been.calledWith();
  });

  it('should not display the "me" message when the emailer is me', function() {
    session.user = { preferredEmail: 'me@linagora.com' };
    $scope.emailer = {
      email: 'another-one@linagora.com',
      resolve: angular.noop
    };

    compileDirective('<inbox-emailer emailer="emailer"/>');

    expect(element.find('.me')).to.have.length(0);
  });

  it('should display the "me" message when the emailer is me', function() {
    session.user = { preferredEmail: 'me@linagora.com' };
    $scope.emailer = {
      email: 'me@linagora.com',
      resolve: angular.noop
    };

    compileDirective('<inbox-emailer emailer="emailer"/>');

    expect(element.find('.me')).to.have.length(1);
  });

  it('should not display the email address if hide-email=true', function() {
    $scope.emailer = {
      email: 'me@linagora.com',
      resolve: angular.noop
    };

    compileDirective('<inbox-emailer emailer="emailer" hide-email="true" />');

    expect(element.find('.email')).to.have.length(0);
  });
});
