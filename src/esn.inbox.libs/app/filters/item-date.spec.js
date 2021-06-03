'use strict';

/* global chai: false, sinon */

const { expect } = chai;

describe('The inboxItemDate filter', function() {

  var inboxItemDateFilter, esnDatetimeService;

  beforeEach(function() {
    angular.mock.module('esn.inbox.libs', function($provide) {
      $provide.value('esnConfig', function(key) {
        if (key === 'core.language') {
          return $q.when('en');
        } if (key === 'core.datetime') {
          return $q.when({ timeZone: 'Europe/Berlin' });
        }

        return $q.when();
      });
    });
  });

  beforeEach(angular.mock.inject(function(_inboxItemDateFilter_, _esnDatetimeService_) {
    inboxItemDateFilter = _inboxItemDateFilter_;
    esnDatetimeService = _esnDatetimeService_;
  }));

  it('should delegate to the "date" filter, requesting date format from esnDatetimeService', function() {
    esnDatetimeService.format = sinon.stub().returns('01/01/1970');
    esnDatetimeService.getHumanTimeGrouping = sinon.stub().returns({ dateFormat: 'shortDate' });

    expect(inboxItemDateFilter(new Date(1970, 0, 1, 12, 0, 0))).to.equal('01/01/1970');
    expect(esnDatetimeService.getHumanTimeGrouping).to.have.been.calledWith(new Date(1970, 0, 1, 12, 0, 0));
    expect(esnDatetimeService.format).to.have.been.calledWith(new Date(1970, 0, 1, 12, 0, 0), 'shortDate');
  });

});
