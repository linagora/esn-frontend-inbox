'use strict';

/* global chai: false, sinon: false, _: false */

const { expect } = chai;

describe('The inboxConfigurationFilterDefinitionController', function() {
  var $controller, $scope, $state, $rootScope, inboxMailboxesService, inboxMailboxesFilterService, JMAP_FILTER, userAPI, esnAuth;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      $provide.value('inboxMailboxesService', {
        assignMailboxesList: angular.noop
      });

      inboxMailboxesFilterService = {
        addFilter: angular.noop,
        editFilter: angular.noop
      };

      userAPI = {
        getUsersByEmail: sinon.stub(),
        user: sinon.spy(function() {
          return [{
            id: '1', firstname: 'user1', lastname: 'user1', preferredEmail: 'user1@test.com'
          }];
        })
      };

      esnAuth = {
        // signInCompletePromise: {
        //   then: callback => callback()
        // }
        signInCompletePromise: $q.when()
      };

      $provide.value('userAPI', userAPI);
      $provide.value('esnAuth', esnAuth);
      $provide.value('inboxMailboxesFilterService', inboxMailboxesFilterService);
    });
  });

  beforeEach(angular.mock.inject(function(
    _$controller_,
    _$rootScope_,
    _$state_,
    _inboxMailboxesService_,
    _JMAP_FILTER_
  ) {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    $state = _$state_;
    inboxMailboxesService = _inboxMailboxesService_;
    JMAP_FILTER = _JMAP_FILTER_;
    _.assign(JMAP_FILTER.CONDITIONS, {
      CONDITION2: { JMAP_KEY: 'condition2', HUMAN_REPRESENTATION: 'conditionMessage2' },
      CONDITION3: { JMAP_KEY: 'condition3', HUMAN_REPRESENTATION: 'conditionMessage3' }
    });
    _.assign(JMAP_FILTER.ACTIONS, {
      ACTION2: { JMAP_KEY: 'action2', HUMAN_REPRESENTATION: 'actionMessage2' },
      ACTION3: { JMAP_KEY: 'action3', HUMAN_REPRESENTATION: 'actionMessage3' }
    });
  }));

  function initController() {
    $scope = $rootScope.$new();

    var controller = $controller('inboxConfigurationFilterDefinitionController');

    $scope.$digest();

    return controller;
  }

  describe('$onInit', function() {
    it('should initialize the mailbox list', function() {
      sinon.spy(inboxMailboxesService, 'assignMailboxesList');

      var controller = initController();

      controller.$onInit();

      expect(inboxMailboxesService.assignMailboxesList).to.have.been.calledWith(controller);
    });

    it('should init the models', function() {
      var controller = initController();

      controller.$onInit();

      expect(controller.conditionsOptions).to.deep.eql([
        { key: 'from', val: 'is from ' },
        { key: 'to', val: 'is addressed to ' },
        { key: 'cc', val: 'is cc\'d to ' },
        { key: 'recipient', val: 'is addressed or cc\'d to ' },
        { key: 'subject', val: 'has subject containing ' },
        { key: 'condition2', val: 'conditionMessage2' },
        { key: 'condition3', val: 'conditionMessage3' }
      ]);
      expect(controller.actionOptions).to.deep.eql([
        { key: 'appendIn', val: 'move to destination folder ' },
        { key: 'action2', val: 'actionMessage2' },
        { key: 'action3', val: 'actionMessage3' }
      ]);
      expect(controller.newFilter.when).to.equal(controller.conditionsOptions[0]);
      expect(controller.newFilter.then).to.equal(controller.actionOptions[0]);
    });

    it('should call initEditForm() when filter ID is provided', function() {
      var controller = initController();

      sinon.stub(controller, 'initEditForm');
      controller.editFilterId = 'b6e82a3f-d175-4138-8cd7-acd30fbcc477';

      controller.$onInit();

      expect(controller.initEditForm).to.have.been.called;
    });
  });

  describe('saving filters', function(done) {
    beforeEach(function() {
      inboxMailboxesFilterService.addFilter = sinon.stub().returns($q.when());
      inboxMailboxesFilterService.editFilter = sinon.stub().returns($q.when());
    });
    describe('when adding a new filter', function() {
      context('when condition is FROM, TO, CC and RECIPIENT', function() {
        it('should add the new filter to the list', function() {
          var controller = initController();

          sinon.spy($state, 'go');

          controller.newFilter = {
            name: 'My filter',
            when: { key: 'from' },
            stakeholders: [{ email: 'admin@open-paas.org' }],
            then: { key: 'appendIn' },
            moveTo: { id: 'b2b44073-325e-4e01-ab59-925ea4723ee9' }
          };

          controller.saveFilter().then(function() {
            expect(inboxMailboxesFilterService.addFilter).to.have.been
              .calledWith('from', 'My filter', 'admin@open-paas.org',
                { action: 'appendIn', mailboxId: 'b2b44073-325e-4e01-ab59-925ea4723ee9' });

            done();
          }).catch(done);

          controller.newFilter.when.key = 'to';
          controller.saveFilter().then(function() {
            expect(inboxMailboxesFilterService.addFilter).to.have.been
              .calledWith('to', 'My filter', 'admin@open-paas.org',
                { action: 'appendIn', mailboxId: 'b2b44073-325e-4e01-ab59-925ea4723ee9' });

            done();
          }).catch(done);

          controller.newFilter.when.key = 'cc';
          controller.saveFilter().then(function() {
            expect(inboxMailboxesFilterService.addFilter).to.have.been
              .calledWith('cc', 'My filter', 'admin@open-paas.org',
                { action: 'appendIn', mailboxId: 'b2b44073-325e-4e01-ab59-925ea4723ee9' });

            done();
          }).catch(done);

          controller.newFilter.when.key = 'recipient';
          controller.saveFilter().then(function() {
            expect(inboxMailboxesFilterService.addFilter).to.have.been
              .calledWith('recipient', 'My filter', 'admin@open-paas.org',
                { action: 'appendIn', mailboxId: 'b2b44073-325e-4e01-ab59-925ea4723ee9' });

            done();
          }).catch(done);

        });

        it('should reject filter form submission if name is not filled', function() {
          var controller = initController();

          controller.newFilter = {
            name: '',
            when: { key: 'subject' },
            subject: 'email subject',
            then: { key: 'appendIn' },
            moveTo: { id: 'b2b44073-325e-4e01-ab59-925ea4723ee9' }
          };

          expect(inboxMailboxesFilterService.addFilter).to.not.have.been.called;
        });

        it('should reject filter form submission when destination mailbox identifier is empty', function() {
          var controller = initController();

          controller.newFilter = {
            name: 'My filter',
            when: { key: 'subject' },
            subject: 'email subject',
            then: { key: 'appendIn' },
            moveTo: { }
          };

          expect(inboxMailboxesFilterService.addFilter).to.not.have.been.called;

        });
      });

      context('when condition is SUBJECT', function() {
        it('should add the new filter to the list', function() {
          var controller = initController();

          sinon.spy($state, 'go');

          controller.newFilter = {
            name: 'My filter',
            when: { key: 'subject' },
            subject: 'email subject',
            then: { key: 'appendIn' },
            moveTo: { id: 'b2b44073-325e-4e01-ab59-925ea4723ee9' }
          };

          controller.saveFilter().then(function() {
            expect(inboxMailboxesFilterService.addFilter).to.have.been
              .calledWith('subject', 'My filter', 'email subject',
                { action: 'appendIn', mailboxId: 'b2b44073-325e-4e01-ab59-925ea4723ee9' });
            done();
          }).catch(done);

        });
      });
    });

    describe('when editing an existing filter', function() {
      context('when condition is FROM, TO, CC and RECIPIENT', function() {
        it('should add the new filter to the list', function() {
          var controller = initController();

          controller.editFilterId = '3ec75e00-414e-4c7d-8a16-1c4fea55131a';

          sinon.spy($state, 'go');

          controller.newFilter = {
            name: 'My filter',
            when: { key: 'from' },
            stakeholders: [{ email: 'admin@open-paas.org' }],
            then: { key: 'appendIn' },
            moveTo: { id: 'b2b44073-325e-4e01-ab59-925ea4723ee9' }
          };

          controller.saveFilter().then(function() {
            expect(inboxMailboxesFilterService.editFilter).to.have.been
              .calledWith('3ec75e00-414e-4c7d-8a16-1c4fea55131a', 'from', 'My filter', 'admin@open-paas.org',
                { action: 'appendIn', mailboxId: 'b2b44073-325e-4e01-ab59-925ea4723ee9' });
            done();
          }).catch(done);

          controller.newFilter.when.key = 'to';
          controller.saveFilter().then(function() {
            expect(inboxMailboxesFilterService.editFilter).to.have.been
              .calledWith('3ec75e00-414e-4c7d-8a16-1c4fea55131a', 'to', 'My filter', 'admin@open-paas.org',
                { action: 'appendIn', mailboxId: 'b2b44073-325e-4e01-ab59-925ea4723ee9' });
            done();
          }).catch(done);

          controller.newFilter.when.key = 'cc';
          controller.saveFilter().then(function() {
            expect(inboxMailboxesFilterService.editFilter).to.have.been
              .calledWith('3ec75e00-414e-4c7d-8a16-1c4fea55131a', 'cc', 'My filter', 'admin@open-paas.org',
                { action: 'appendIn', mailboxId: 'b2b44073-325e-4e01-ab59-925ea4723ee9' });
            done();
          }).catch(done);

          controller.newFilter.when.key = 'recipient';
          controller.saveFilter().then(function() {
            expect(inboxMailboxesFilterService.editFilter).to.have.been
              .calledWith('3ec75e00-414e-4c7d-8a16-1c4fea55131a', 'recipient', 'My filter', 'admin@open-paas.org',
                { action: 'appendIn', mailboxId: 'b2b44073-325e-4e01-ab59-925ea4723ee9' });
            done();
          }).catch(done);

        });
      });

      context('when condition is SUBJECT', function() {
        it('should add the new filter to the list', function() {
          var controller = initController();

          controller.editFilterId = '3ec75e00-414e-4c7d-8a16-1c4fea55131a';

          sinon.spy($state, 'go');

          controller.newFilter = {
            name: 'My filter',
            when: { key: 'subject' },
            subject: 'email subject',
            then: { key: 'appendIn' },
            moveTo: { id: 'b2b44073-325e-4e01-ab59-925ea4723ee9' }
          };

          controller.saveFilter().then(function() {
            expect(inboxMailboxesFilterService.editFilter).to.have.been
              .calledWith('3ec75e00-414e-4c7d-8a16-1c4fea55131a', 'subject', 'My filter', 'email subject',
                { action: 'appendIn', mailboxId: 'b2b44073-325e-4e01-ab59-925ea4723ee9' });
            done();
          }).catch(done);

        });
      });
    });

    it('should redirect', function() {
      sinon.spy($state, 'go');

      var controller = initController();

      controller.newFilter = {
        name: 'My filter',
        when: { key: 'from' },
        stakeholders: [{ email: 'admin@open-paas.org' }],
        then: { key: 'appendIn' },
        moveTo: { id: 'b2b44073-325e-4e01-ab59-925ea4723ee9' }
      };

      controller.saveFilter().then(function() {
        expect($state.go).to.have.been.calledWith('unifiedinbox.configuration.filters');
        done();
      }).catch(done);
    });
  });

  describe('hideMoreResults', function() {
    it('should return true when the filter contains one email', function() {
      var controller = $controller('inboxConfigurationFilterDefinitionController');

      controller.newFilter.stakeholders = undefined;
      expect(controller.hideMoreResults()).to.be.false;

      controller.newFilter.stakeholders = [];
      expect(controller.hideMoreResults()).to.be.false;

      controller.newFilter.stakeholders = [undefined];
      expect(controller.hideMoreResults()).to.be.true;
    });
  });

  describe('initEditForm', function() {
    it('should start initing `newFilter`', function(done) {
      inboxMailboxesFilterService.getFilters = sinon.stub().returns($q.when());
      inboxMailboxesFilterService.filtersIds = {
        '3ec75e00-414e-4c7d-8a16-1c4fea55131a': {
          name: 'My filter',
          condition: {
            field: 'condition2'
          },
          action: { action2: {} }
        }
      };

      var controller = initController();

      controller.$onInit();

      controller.editFilterId = '3ec75e00-414e-4c7d-8a16-1c4fea55131a';
      controller.initEditForm().then(function() {
        expect(controller.newFilter).to.deep.eql({
          name: 'My filter',
          when: { key: 'condition2', val: 'conditionMessage2' },
          then: { key: 'action2', val: 'actionMessage2' }
        });

        done();
      });

      $rootScope.$digest();
    });

    describe('initializing conditions', function() {
      it('should initilize the model when condition is JMAP_FILTER.CONDITIONS.FROM.JMAP_KEY', function(done) {
        userAPI.getUsersByEmail.withArgs('open-paas.org').returns($q.when({
          data: [{
            preferredEmail: 'open-paas.org',
            firstname: 'admin',
            lastname: 'admin'
          }]
        }));
        inboxMailboxesFilterService.getFilters = sinon.stub().returns($q.when());
        inboxMailboxesFilterService.filtersIds = {
          '3ec75e00-414e-4c7d-8a16-1c4fea55131a': {
            name: 'My filter',
            condition: {
              field: JMAP_FILTER.CONDITIONS.FROM.JMAP_KEY,
              value: 'open-paas.org'
            },
            action: { action2: {} }
          }
        };

        var controller = initController();

        controller.$onInit();

        controller.editFilterId = '3ec75e00-414e-4c7d-8a16-1c4fea55131a';
        controller.initEditForm().then(function() {
          expect(controller.newFilter).to.deep.eql({
            name: 'My filter',
            when: { key: JMAP_FILTER.CONDITIONS.FROM.JMAP_KEY, val: 'is from ' },
            then: { key: 'action2', val: 'actionMessage2' },
            stakeholders: [{
              email: 'open-paas.org',
              name: 'admin admin'
            }]
          });

          done();
        });

        $rootScope.$digest();
      });
      it('should initilize the model when condition is JMAP_FILTER.CONDITIONS.TO.JMAP_KEY', function(done) {
        userAPI.getUsersByEmail.withArgs('open-paas.org').returns($q.when({
          data: [{
            preferredEmail: 'open-paas.org',
            firstname: 'admin',
            lastname: 'admin'
          }]
        }));
        inboxMailboxesFilterService.getFilters = sinon.stub().returns($q.when());
        inboxMailboxesFilterService.filtersIds = {
          '3ec75e00-414e-4c7d-8a16-1c4fea55131a': {
            name: 'My filter',
            condition: {
              field: JMAP_FILTER.CONDITIONS.TO.JMAP_KEY,
              value: 'open-paas.org'
            },
            action: { action2: {} }
          }
        };

        var controller = initController();

        controller.$onInit();

        controller.editFilterId = '3ec75e00-414e-4c7d-8a16-1c4fea55131a';
        controller.initEditForm().then(function() {
          expect(controller.newFilter).to.deep.eql({
            name: 'My filter',
            when: { key: JMAP_FILTER.CONDITIONS.TO.JMAP_KEY, val: 'is addressed to ' },
            then: { key: 'action2', val: 'actionMessage2' },
            stakeholders: [{
              email: 'open-paas.org',
              name: 'admin admin'
            }]
          });

          done();
        });

        $rootScope.$digest();
      });
      it('should initilize the model when condition is JMAP_FILTER.CONDITIONS.CC.JMAP_KEY', function(done) {
        userAPI.getUsersByEmail.withArgs('open-paas.org').returns($q.when({
          data: [{
            preferredEmail: 'open-paas.org',
            firstname: 'admin',
            lastname: 'admin'
          }]
        }));
        inboxMailboxesFilterService.getFilters = sinon.stub().returns($q.when());
        inboxMailboxesFilterService.filtersIds = {
          '3ec75e00-414e-4c7d-8a16-1c4fea55131a': {
            name: 'My filter',
            condition: {
              field: JMAP_FILTER.CONDITIONS.CC.JMAP_KEY,
              value: 'open-paas.org'
            },
            action: { action2: {} }
          }
        };

        var controller = initController();

        controller.$onInit();

        controller.editFilterId = '3ec75e00-414e-4c7d-8a16-1c4fea55131a';
        controller.initEditForm().then(function() {
          expect(controller.newFilter).to.deep.eql({
            name: 'My filter',
            when: { key: JMAP_FILTER.CONDITIONS.CC.JMAP_KEY, val: 'is cc\'d to ' },
            then: { key: 'action2', val: 'actionMessage2' },
            stakeholders: [{
              email: 'open-paas.org',
              name: 'admin admin'
            }]
          });

          done();
        });

        $rootScope.$digest();
      });
      it('should initilize the model when condition is JMAP_FILTER.CONDITIONS.RECIPIENT.JMAP_KEY', function(done) {
        userAPI.getUsersByEmail.withArgs('open-paas.org').returns($q.when({
          data: [{
            preferredEmail: 'open-paas.org',
            firstname: 'admin',
            lastname: 'admin'
          }]
        }));
        inboxMailboxesFilterService.getFilters = sinon.stub().returns($q.when());
        inboxMailboxesFilterService.filtersIds = {
          '3ec75e00-414e-4c7d-8a16-1c4fea55131a': {
            name: 'My filter',
            condition: { field: JMAP_FILTER.CONDITIONS.RECIPIENT.JMAP_KEY, value: 'open-paas.org' },
            action: { action2: {} }
          }
        };

        var controller = initController();

        controller.$onInit();

        controller.editFilterId = '3ec75e00-414e-4c7d-8a16-1c4fea55131a';
        controller.initEditForm().then(function() {
          expect(controller.newFilter).to.deep.eql({
            name: 'My filter',
            when: {
              key: JMAP_FILTER.CONDITIONS.RECIPIENT.JMAP_KEY,
              val: 'is addressed or cc\'d to '
            },
            then: { key: 'action2', val: 'actionMessage2' },
            stakeholders: [{
              email: 'open-paas.org',
              name: 'admin admin'
            }]
          });

          done();
        });

        $rootScope.$digest();
      });
      it('should initilize the model when condition is JMAP_FILTER.CONDITIONS.SUBJECT.JMAP_KEY', function(done) {
        userAPI.getUsersByEmail.withArgs('open-paas.org').returns($q.when({
          data: [{
            preferredEmail: 'open-paas.org',
            firstname: 'admin',
            lastname: 'admin'
          }]
        }));
        inboxMailboxesFilterService.getFilters = sinon.stub().returns($q.when());
        inboxMailboxesFilterService.filtersIds = {
          '3ec75e00-414e-4c7d-8a16-1c4fea55131a': {
            name: 'My filter',
            condition: {
              field: JMAP_FILTER.CONDITIONS.SUBJECT.JMAP_KEY,
              value: 'email subject'
            },
            action: { action2: {} }
          }
        };

        var controller = initController();

        controller.$onInit();

        controller.editFilterId = '3ec75e00-414e-4c7d-8a16-1c4fea55131a';
        controller.initEditForm().then(function() {
          expect(controller.newFilter).to.deep.eql({
            name: 'My filter',
            when: {
              key: JMAP_FILTER.CONDITIONS.SUBJECT.JMAP_KEY,
              val: 'has subject containing '
            },
            then: { key: 'action2', val: 'actionMessage2' },
            subject: 'email subject'
          });

          done();
        });

        $rootScope.$digest();
      });
    });

    describe('initializing action', function() {
      it('should initilize the model when condition is JMAP_FILTER.CONDITIONS.FROM.JMAP_KEY', function(done) {
        var mailboxes = [{ id: 'aca5887c-2a90-4180-9b53-042f7917f4d8', name: 'My mailbox' }];

        inboxMailboxesService.assignMailboxesList = function(object) {
          object.mailboxes = mailboxes;

          return $q.when();
        };

        inboxMailboxesFilterService.getFilters = sinon.stub().returns($q.when());
        inboxMailboxesFilterService.filtersIds = {
          '3ec75e00-414e-4c7d-8a16-1c4fea55131a': {
            name: 'My filter',
            condition: {
              field: 'condition2'
            },
            action: { appendIn: { mailboxIds: ['aca5887c-2a90-4180-9b53-042f7917f4d8'] } }
          }
        };

        var controller = initController();

        controller.$onInit();

        controller.editFilterId = '3ec75e00-414e-4c7d-8a16-1c4fea55131a';
        controller.initEditForm().then(function() {
          expect(controller.newFilter).to.deep.eql({
            name: 'My filter',
            when: { key: 'condition2', val: 'conditionMessage2' },
            then: { key: 'appendIn', val: 'move to destination folder ' },
            moveTo: { id: 'aca5887c-2a90-4180-9b53-042f7917f4d8', name: 'My mailbox' }
          });

          done();
        });

        $rootScope.$digest();
      });
    });
  });

  describe('_initStakeholdersField', function() {
    it('should fill self.newFilter.stakeholders when API user returns a response', function(done) {
      var target = initController();

      userAPI.getUsersByEmail = sinon.stub().returns($q.when({
        data: [{
          preferredEmail: 'test@test.test',
          firstname: 'Mr.',
          lastname: 'Test'
        }]
      }));

      target._initStakeholdersField({ condition: { value: 'admin@open-paas.org' } }).then(function() {
        expect(target.newFilter.stakeholders).to.deep.eql([{
          email: 'test@test.test',
          name: 'Mr. Test'
        }]);

        done();
      });

      $rootScope.$digest();
    });

    it('should fill self.newFilter.stakeholders when API user returns no response', function(done) {
      var target = initController();

      userAPI.getUsersByEmail = sinon.stub().returns($q.when({}));

      target._initStakeholdersField({ condition: { value: 'admin@open-paas.org' } }).then(function() {
        expect(target.newFilter.stakeholders).to.deep.eql([{
          email: 'admin@open-paas.org',
          name: 'admin@open-paas.org'
        }]);

        done();
      });

      $rootScope.$digest();
    });

    it('should fill self.newFilter.stakeholders when API user returns an error', function(done) {
      var target = initController();

      userAPI.getUsersByEmail = sinon.stub().returns($q.reject());

      target._initStakeholdersField({ condition: { value: 'admin@open-paas.org' } }).then(function() {
        expect(target.newFilter.stakeholders).to.deep.eql([{
          email: 'admin@open-paas.org',
          name: 'admin@open-paas.org'
        }]);

        done();
      });

      $rootScope.$digest();
    });
  });
});
