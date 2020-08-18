'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The inboxMailboxesFilterService factory', function() {
  var $rootScope, asyncJmapAction, jmapClient, inboxMailboxesFilterService, JMAP_FILTER, jmapDraft;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      jmapClient = {
        getFilter: sinon.stub().callsFake(function() { // $q is not injected at this stage, `.returns` is unusable
          return $q.when([]);
        }),
        setFilter: sinon.stub().callsFake(function() { // $q is not injected at this stage, `.returns` is unusable
          return $q.when();
        })
      };

      asyncJmapAction = sinon.stub().callsFake(function(object, callback) {
        var fn = callback || object;

        return fn(jmapClient);
      });

      var inboxMailboxesService = {
        assignMailboxesList: function(object) {
          object.mailboxes = [{id: '79a160a7-55c1-4fec-87d8-c90c70373990', qualifiedName: 'INBOX'}];
        }
      };

      $provide.value('asyncJmapAction', asyncJmapAction);
      $provide.value('withJmapClient', asyncJmapAction);
      $provide.value('inboxMailboxesService', inboxMailboxesService);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _inboxMailboxesFilterService_, _JMAP_FILTER_, _jmapDraft_) {
    inboxMailboxesFilterService = _inboxMailboxesFilterService_;
    JMAP_FILTER = _JMAP_FILTER_;
    $rootScope = _$rootScope_;
    jmapDraft = _jmapDraft_;
    jmapDraft.OldFilterRule = jmapDraft.OldFilterRule || jmapDraft.FilterRule;
    jmapDraft.FilterRule = getDeterministicFilterRule();
  }));

  function getDeterministicFilterRule() {
    var id = 0;
    var FilterRule = function(jmapClient, name) {
      var res = new jmapDraft.OldFilterRule(jmapClient, name);

      res.id = String(++id);

      return res;
    };

    FilterRule.Comparator = jmapDraft.OldFilterRule.Comparator;

    return FilterRule;
  }

  describe('addFilter', function() {
    it('should add a new filter', function(done) {
      var expected = {
        id: '1',
        name: 'My filter',
        condition: {
          field: 'from',
          comparator: 'exactly-equals',
          value: 'admin@open-paas.org'
        },
        action: {
          appendIn: {
            mailboxIds: ['79a160a7-55c1-4fec-87d8-c90c70373990']
          }
        }
      };

      inboxMailboxesFilterService.addFilter(
        JMAP_FILTER.CONDITIONS.FROM.JMAP_KEY, 'My filter', 'admin@open-paas.org', {
          action: JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY,
          mailboxId: '79a160a7-55c1-4fec-87d8-c90c70373990'
        }).then(function() {
          expect(inboxMailboxesFilterService.filters.length).to.equal(1);
          expect(inboxMailboxesFilterService.filters[0]).to.deep.eql(expected);
          expect(Object.keys(inboxMailboxesFilterService.filtersIds).length).to.equal(1);
          expect(inboxMailboxesFilterService.filtersIds[Object.keys(inboxMailboxesFilterService.filtersIds)[0]])
            .to.deep.eql(expected);

          done();
          }).catch(done);

      $rootScope.$digest();
    });
  });

  describe('editFilter', function() {
    beforeEach(function() {
      inboxMailboxesFilterService.addFilter(
        JMAP_FILTER.CONDITIONS.FROM.JMAP_KEY, 'My filter', 'admin@open-paas.org', {
          action: JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY,
          mailboxId: '79a160a7-55c1-4fec-87d8-c90c70373990'
        });

      $rootScope.$digest();
    });

    it('should edit an existing filter', function(done) {
      var expected = {
        id: '1',
        name: 'My filter',
        condition: {
          field: 'from',
          comparator: 'exactly-equals',
          value: 'admin@open-paas.org'
        },
        action: {
          appendIn: {
            mailboxIds: ['79a160a7-55c1-4fec-87d8-c90c70373990']
          }
        }
      };

      expect(inboxMailboxesFilterService.filters.length).to.equal(1);
      expect(inboxMailboxesFilterService.filters[0]).to.deep.eql(expected);
      expect(Object.keys(inboxMailboxesFilterService.filtersIds).length).to.equal(1);
      expect(inboxMailboxesFilterService.filtersIds[Object.keys(inboxMailboxesFilterService.filtersIds)[0]])
        .to.deep.eql(expected);

      inboxMailboxesFilterService.editFilter('1',
        JMAP_FILTER.CONDITIONS.CC.JMAP_KEY, 'My filter 2', 'test@test.test', {
          action: JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY,
          mailboxId: '79a160a7-55c1-4fec-87d8-c90c70373990'
        }).then(function() {
          expected.name = 'My filter 2';
          expected.condition.field = 'cc';
          expected.condition.value = 'test@test.test';

          expect(inboxMailboxesFilterService.filters.length).to.equal(1);
          expect(inboxMailboxesFilterService.filters[0]).to.deep.eql(expected);
          expect(Object.keys(inboxMailboxesFilterService.filtersIds).length).to.equal(1);
          expect(inboxMailboxesFilterService.filtersIds[Object.keys(inboxMailboxesFilterService.filtersIds)[0]])
            .to.deep.eql(expected);

            done();
          }).catch(done);

      $rootScope.$digest();
    });
  });

  describe('deleteFilter', function() {
    beforeEach(function() {
      jmapDraft.FilterRule = getDeterministicFilterRule();

      inboxMailboxesFilterService.addFilter(
        JMAP_FILTER.CONDITIONS.FROM.JMAP_KEY, 'My filter 1', 'admin@open-paas.org', {
          action: JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY,
          mailboxId: '79a160a7-55c1-4fec-87d8-c90c70373990'
        });

      inboxMailboxesFilterService.addFilter(
        JMAP_FILTER.CONDITIONS.FROM.JMAP_KEY, 'My filter 2', 'admin@open-paas.org', {
          action: JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY,
          mailboxId: '79a160a7-55c1-4fec-87d8-c90c70373990'
        });

      $rootScope.$digest();
    });

    it('should should retrun false when trying to delete an inexistant filter', function() {
      expect(inboxMailboxesFilterService.deleteFilter('5e4003c6-8f09-40d3-b75c-46a7e92a6440')).to.be.false;
    });

    it('should remove the filter and notify when the filter was deleted', function(done) {
        var expected = {
            id: '2',
          name: 'My filter 2',
          condition: {
            field: 'from',
            comparator: 'exactly-equals',
            value: 'admin@open-paas.org'
          },
          action: {appendIn: {mailboxIds: ['79a160a7-55c1-4fec-87d8-c90c70373990']}}
        };

        inboxMailboxesFilterService.deleteFilter('1').then(function() {
          expect(inboxMailboxesFilterService.filtersIds).to.deep.eql({2: expected});
          expect(inboxMailboxesFilterService.filters).to.deep.eql([expected]);

          done();
        }).catch(done);

      $rootScope.$digest();
    });
  });

  describe('getFilters', function() {
    it('it should not get filters from client if filters are already defined', function(done) {

      asyncJmapAction = sinon.stub().returns($q.when([]));

      inboxMailboxesFilterService.filters = [1, 2, 3];

      $rootScope.$digest();

      inboxMailboxesFilterService.getFilters().then(function(filters) {
        expect(jmapClient.getFilter).to.not.have.been.called;
        expect(filters).to.eql([1, 2, 3]);

        done();
      }).catch(done);

      $rootScope.$digest();
    });

    it('should query the backend', function(done) {
      var filter1 = {
        id: '116e2454-3d55-4fe3-948c-95a7e2e92abe',
        name: 'My filter 1',
        condition: {
          field: 'from',
          comparator: 'exactly-equals',
          value: 'admin@open-paas.org'
        },
        action: {
          appendIn: {
            mailboxIds: ['79a160a7-55c1-4fec-87d8-c90c70373990']
          }
        }
      };

      var filter2 = {
        id: 'a2d71896-b5c3-479e-a88f-e72706641a42',
        name: 'My filter 2',
        condition: {
          field: 'from',
          comparator: 'exactly-equals',
          value: 'admin@open-paas.org'
        },
        action: {
          appendIn: {
            mailboxIds: ['79a160a7-55c1-4fec-87d8-c90c70373990']
          }
        }
      };

      jmapClient.getFilter.returns($q.when([filter1, filter2]));

      inboxMailboxesFilterService.getFilters().then(function() {
        expect(inboxMailboxesFilterService.filters.length).to.equal(2);
        expect(inboxMailboxesFilterService.filters[0]).to.deep.eql(filter1);
        expect(inboxMailboxesFilterService.filters[1]).to.deep.eql(filter2);

        expect(inboxMailboxesFilterService.filtersIds[filter1.id]).to.deep.eql(filter1);
        expect(inboxMailboxesFilterService.filtersIds[filter2.id]).to.deep.eql(filter2);

        done();
      }).catch(done);

      $rootScope.$digest();
    });
  });

  describe('filters setter', function() {
    it('should try setting the filters remotely', function() {
      var filter1 = {
        id: '116e2454-3d55-4fe3-948c-95a7e2e92abe',
        name: 'My filter 1',
        condition: {
          field: 'from',
          comparator: 'exactly-equals',
          value: 'admin@open-paas.org'
        },
        action: {
          appendIn: {
            mailboxIds: ['79a160a7-55c1-4fec-87d8-c90c70373990']
          }
        }
      };

      var filter2 = {
        id: 'a2d71896-b5c3-479e-a88f-e72706641a42',
        name: 'My filter 2',
        condition: {
          field: 'from',
          comparator: 'exactly-equals',
          value: 'admin@open-paas.org'
        },
        action: {
          appendIn: {
            mailboxIds: ['79a160a7-55c1-4fec-87d8-c90c70373990']
          }
        }
      };

      inboxMailboxesFilterService.filters = [filter1, filter2];
      expect(jmapClient.setFilter).to.have.been.calledWith([filter1, filter2]);
    });

    it('should set the filters locally', function(done) {
      var filter1 = {
        id: '116e2454-3d55-4fe3-948c-95a7e2e92abe',
        name: 'My filter 1',
        condition: {
          field: 'from',
          comparator: 'exactly-equals',
          value: 'admin@open-paas.org'
        },
        action: {
          appendIn: {
            mailboxIds: ['79a160a7-55c1-4fec-87d8-c90c70373990']
          }
        }
      };

      var filter2 = {
        id: 'a2d71896-b5c3-479e-a88f-e72706641a42',
        name: 'My filter 2',
        condition: {
          field: 'from',
          comparator: 'exactly-equals',
          value: 'admin@open-paas.org'
        },
        action: {
          appendIn: {
            mailboxIds: ['79a160a7-55c1-4fec-87d8-c90c70373990']
          }
        }
      };

      inboxMailboxesFilterService.filters = [];
      jmapClient.setFilter().then(function() {
        expect(inboxMailboxesFilterService.filters).to.deep.eql([]);

        inboxMailboxesFilterService.filters = [filter1, filter2];

        jmapClient.setFilter().then(function() {
          expect(inboxMailboxesFilterService.filters).to.deep.eql([filter1, filter2]);
          done();
        });
      });

      $rootScope.$digest();
    });
  });

  describe('getFilterSummary', function() {
    context('when condition is JMAP_FILTER.CONDITIONS.FROM', function() {
      it('should correctly translate the filter', function() {
        inboxMailboxesFilterService.addFilter(
          JMAP_FILTER.CONDITIONS.FROM.JMAP_KEY, 'My filter', 'admin@open-paas.org', {
            action: JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY,
            mailboxId: '79a160a7-55c1-4fec-87d8-c90c70373990'
          });

        $rootScope.$digest();

        var filter = inboxMailboxesFilterService.filters[0];
        var target = inboxMailboxesFilterService.getFilterSummary(filter);

        expect(target).to
          .eql('If a message is from &#65279;<b>admin@open-paas.org</b>&#65279; then move to destination folder &#65279;<b>INBOX</b>&#65279;');
      });
    });

    context('when condition is JMAP_FILTER.CONDITIONS.TO', function() {
      it('should correctly translate the filter', function() {
        inboxMailboxesFilterService.addFilter(
          JMAP_FILTER.CONDITIONS.TO.JMAP_KEY, 'My filter', 'admin@open-paas.org', {
            action: JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY,
            mailboxId: '79a160a7-55c1-4fec-87d8-c90c70373990'
          });

        $rootScope.$digest();

        var filter = inboxMailboxesFilterService.filters[0];
        var target = inboxMailboxesFilterService.getFilterSummary(filter);

        expect(target).to
          .eql('If a message is addressed to &#65279;<b>admin@open-paas.org</b>&#65279; then move to destination folder &#65279;<b>INBOX</b>&#65279;');
      });
    });

    context('when condition is JMAP_FILTER.CONDITIONS.CC', function() {
      it('should correctly translate the filter', function() {
        inboxMailboxesFilterService.addFilter(
          JMAP_FILTER.CONDITIONS.CC.JMAP_KEY, 'My filter', 'admin@open-paas.org', {
            action: JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY,
            mailboxId: '79a160a7-55c1-4fec-87d8-c90c70373990'
          });

        $rootScope.$digest();

        var filter = inboxMailboxesFilterService.filters[0];
        var target = inboxMailboxesFilterService.getFilterSummary(filter);

        expect(target).to
          .eql('If a message is cc\'d to &#65279;<b>admin@open-paas.org</b>&#65279; then move to destination folder &#65279;<b>INBOX</b>&#65279;');
      });
    });

    context('when condition is JMAP_FILTER.CONDITIONS.RECIPIENT', function() {
      it('should correctly translate the filter', function() {
        inboxMailboxesFilterService.addFilter(
          JMAP_FILTER.CONDITIONS.RECIPIENT.JMAP_KEY, 'My filter', 'admin@open-paas.org', {
            action: JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY,
            mailboxId: '79a160a7-55c1-4fec-87d8-c90c70373990'
          });

        $rootScope.$digest();

        var filter = inboxMailboxesFilterService.filters[0];
        var target = inboxMailboxesFilterService.getFilterSummary(filter);

        expect(target).to
          .eql('If a message is addressed or cc\'d to &#65279;<b>admin@open-paas.org</b>&#65279; then move to destination folder &#65279;<b>INBOX</b>&#65279;');
      });
    });

    context('when condition is JMAP_FILTER.CONDITIONS.SUBJECT', function() {
      it('should correctly translate the filter', function() {
        inboxMailboxesFilterService.addFilter(
          JMAP_FILTER.CONDITIONS.SUBJECT.JMAP_KEY, 'My filter', 'admin@open-paas.org', {
            action: JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY,
            mailboxId: '79a160a7-55c1-4fec-87d8-c90c70373990'
          });

        $rootScope.$digest();

        var filter = inboxMailboxesFilterService.filters[0];
        var target = inboxMailboxesFilterService.getFilterSummary(filter);

        expect(target).to
          .eql('If a message has subject containing &#65279;<b>"admin@open-paas.org"</b>&#65279; then move to' +
            ' destination folder &#65279;<b>INBOX</b>&#65279;');
      });
    });
  });
});
