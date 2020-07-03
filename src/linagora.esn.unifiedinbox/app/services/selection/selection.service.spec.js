
'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The inboxSelectionService factory', function() {
  var inboxSelectionService, inboxFilteredList;

  beforeEach(module('linagora.esn.unifiedinbox'));

  beforeEach(module(function($provide) {
    inboxFilteredList = {
      list: sinon.stub()
    };

    $provide.value('inboxFilteredList', inboxFilteredList);
  }));

  beforeEach(inject(function(_inboxSelectionService_) {
    inboxSelectionService = _inboxSelectionService_;
  }));

  describe('The isSelecting function', function() {

    it('should return false when no items are selected', function() {
      expect(inboxSelectionService.isSelecting()).to.equal(false);
    });

    it('should return true when at least one item is selected', function() {
      inboxSelectionService.toggleItemSelection({});

      expect(inboxSelectionService.isSelecting()).to.equal(true);
    });

  });

  describe('The getSelectedItems function', function() {

    it('should return an empty array when no items are selected', function() {
      expect(inboxSelectionService.getSelectedItems()).to.deep.equal([]);
    });

    it('should return the selected items when at least one item is selected', function() {
      inboxSelectionService.toggleItemSelection({ id: 1 });
      inboxSelectionService.toggleItemSelection({ id: 2 });

      expect(inboxSelectionService.getSelectedItems()).to.deep.equal([
        { id: 1, selected: true },
        { id: 2, selected: true }
      ]);
    });

    it('should return a clone of the selected elements', function() {
      inboxSelectionService.toggleItemSelection({ id: 1 });
      inboxSelectionService.toggleItemSelection({ id: 2 });

      var selectedItems = inboxSelectionService.getSelectedItems();

      inboxSelectionService.unselectAllItems();
      expect(selectedItems).to.shallowDeepEqual([
        { id: 1, selected: false },
        { id: 2, selected: false }
      ]);
    });

  });

  describe('The unselectAllItems function', function() {

    it('should unselect all items', function() {
      var item1 = { id: 1 },
          item2 = { id: 2 };

      inboxSelectionService.toggleItemSelection(item1);
      inboxSelectionService.toggleItemSelection(item2);
      inboxSelectionService.unselectAllItems();

      expect(item1).to.deep.equal({ id: 1, selected: false });
      expect(item2).to.deep.equal({ id: 2, selected: false });
      expect(inboxSelectionService.getSelectedItems()).to.deep.equal([]);
    });

  });

  describe('The toggleItemSelection function', function() {

    it('should select an unselected item, when called with a single argument', function() {
      inboxSelectionService.toggleItemSelection({ id: 1 });

      expect(inboxSelectionService.getSelectedItems()).to.deep.equal([{ id: 1, selected: true }]);
    });

    it('should unselect an selected item, when called with a single argument', function() {
      var item1 = { id: 1, selected: true };

      inboxSelectionService.toggleItemSelection(item1);

      expect(item1).to.deep.equal({ id: 1, selected: false });
      expect(inboxSelectionService.getSelectedItems()).to.deep.equal([]);
    });

    it('should select an item, when called with true as the second argument', function() {
      var item1 = { id: 1 };

      inboxSelectionService.toggleItemSelection(item1, true);

      expect(inboxSelectionService.getSelectedItems()).to.deep.equal([{ id: 1, selected: true }]);
    });

    it('should unselect an item, when called with false as the second argument', function() {
      inboxSelectionService.toggleItemSelection({ id: 1, selected: true }, false);

      expect(inboxSelectionService.getSelectedItems()).to.deep.equal([]);
    });

  });

  describe('The groupSelection function', function() {
    var list;

    beforeEach(function() {
      list = [];
      inboxFilteredList.list.returns(list);
    });

    it('should return -1 when input item is undefined', function() {
      var result = inboxSelectionService.groupSelection();

      expect(result).to.equal(-1);
      expect(inboxFilteredList.list).to.not.have.been.called;
    });

    it('should return -1 when input item does not have id', function() {
      var result = inboxSelectionService.groupSelection({});

      expect(result).to.equal(-1);
      expect(inboxFilteredList.list).to.not.have.been.called;
    });

    it('should return -1 if input item is not in the list', function() {
      var result = inboxSelectionService.groupSelection({ id: 1 });

      expect(result).to.equal(-1);
      expect(inboxFilteredList.list).to.have.been.called;
    });

    it('should select input item if not selected and no other items are selected', function() {
      list.push(
        { id: 1, selected: false },
        { id: 2, selected: false },
        { id: 3, selected: false }
      );
      inboxSelectionService.groupSelection({ id: 1 });

      expect(inboxFilteredList.list).to.have.been.called;
      expect(inboxSelectionService.getSelectedItems()).to.deep.equals([
        { id: 1, selected: true }
      ]);
      expect(inboxSelectionService.isSelecting()).to.be.true;
    });

    it('should unselect input item if selected and no other items are selected', function() {
      inboxSelectionService.toggleItemSelection({ id: 2 });

      list.push(
        { id: 1, selected: false },
        { id: 2, selected: true },
        { id: 3, selected: false }
      );
      inboxSelectionService.groupSelection({ id: 2 });

      expect(inboxFilteredList.list).to.have.been.called;
      expect(inboxSelectionService.getSelectedItems()).to.be.empty;
      expect(inboxSelectionService.isSelecting()).to.be.false;
    });

    describe('When selected item is the first one in the list', function() {
      it('should unselect if selected', function() {
        inboxSelectionService.toggleItemSelection({ id: 1 });
        inboxSelectionService.toggleItemSelection({ id: 2 });

        list.push(
          { id: 1, selected: true },
          { id: 2, selected: true },
          { id: 3 }
        );
        inboxSelectionService.groupSelection({ id: 1, selected: true });

      expect(inboxFilteredList.list).to.have.been.called;
      expect(inboxSelectionService.getSelectedItems()).to.deep.equals([
        { id: 2, selected: true }
      ]);
      expect(inboxSelectionService.isSelecting()).to.be.true;

      });

      it('should select if unselected', function() {
        inboxSelectionService.toggleItemSelection({ id: 2 });

        list.push(
          { id: 1 },
          { id: 2, selected: true },
          { id: 3 }
        );
        inboxSelectionService.groupSelection({ id: 1, selected: false });

      expect(inboxFilteredList.list).to.have.been.called;
      expect(inboxSelectionService.getSelectedItems()).to.deep.equals([
        { id: 2, selected: true },
        { id: 1, selected: true }
      ]);
      expect(inboxSelectionService.isSelecting()).to.be.true;
      });
    });

    describe('When input item is after others selected', function() {
      it('should select all the items from the last selected to the input one', function() {
        inboxSelectionService.toggleItemSelection({ id: 2 });

        list.push(
          { id: 1 },
          { id: 2, selected: true },
          { id: 3 },
          { id: 4 },
          { id: 5 },
          { id: 6 }
        );
        inboxSelectionService.groupSelection({ id: 4 });

        expect(inboxFilteredList.list).to.have.been.called;
        expect(inboxSelectionService.getSelectedItems()).to.deep.equals([
          { id: 2, selected: true },
          { id: 3, selected: true },
          { id: 4, selected: true }
        ]);
        expect(inboxSelectionService.isSelecting()).to.be.true;
      });
    });

    describe('When input item is before others selected', function() {
      it('should select all the items from the input one to the next selected', function() {
        inboxSelectionService.toggleItemSelection({ id: 2 });
        inboxSelectionService.toggleItemSelection({ id: 6 });

        list.push(
          { id: 1 },
          { id: 2, selected: true },
          { id: 3 },
          { id: 4 },
          { id: 5 },
          { id: 6, selected: true },
          { id: 7 }
        );
        inboxSelectionService.groupSelection({ id: 4 });

        expect(inboxFilteredList.list).to.have.been.called;
        expect(inboxSelectionService.getSelectedItems()).to.deep.equals([
          { id: 2, selected: true },
          { id: 6, selected: true },
          { id: 4, selected: true },
          { id: 5, selected: true }
        ]);
        expect(inboxSelectionService.isSelecting()).to.be.true;
      });
    });

    describe('When input item is between 2 selected items', function() {
      it('should select it if not selected', function() {
        inboxSelectionService.toggleItemSelection({ id: 2 });
        inboxSelectionService.toggleItemSelection({ id: 3 });
        inboxSelectionService.toggleItemSelection({ id: 4 });
        inboxSelectionService.toggleItemSelection({ id: 6 });

        list.push(
          { id: 1 },
          { id: 2, selected: true },
          { id: 3, selected: true },
          { id: 4, selected: true },
          { id: 5 },
          { id: 6, selected: true },
          { id: 7 }
        );
        inboxSelectionService.groupSelection({ id: 5, selected: false });

        expect(inboxFilteredList.list).to.have.been.called;
        expect(inboxSelectionService.getSelectedItems()).to.deep.equals([
          { id: 2, selected: true },
          { id: 3, selected: true },
          { id: 4, selected: true },
          { id: 6, selected: true },
          { id: 5, selected: true }
        ]);
        expect(inboxSelectionService.isSelecting()).to.be.true;
      });

      it('should unselect it if selected', function() {
        inboxSelectionService.toggleItemSelection({ id: 2 });
        inboxSelectionService.toggleItemSelection({ id: 3 });
        inboxSelectionService.toggleItemSelection({ id: 4 });
        inboxSelectionService.toggleItemSelection({ id: 5 });
        inboxSelectionService.toggleItemSelection({ id: 6 });

        list.push(
          { id: 1 },
          { id: 2, selected: true },
          { id: 3, selected: true },
          { id: 4, selected: true },
          { id: 5, selected: true },
          { id: 6, selected: true },
          { id: 7 }
        );
        inboxSelectionService.groupSelection({ id: 5, selected: true });

        expect(inboxFilteredList.list).to.have.been.called;
        expect(inboxSelectionService.getSelectedItems()).to.deep.equals([
          { id: 2, selected: true },
          { id: 3, selected: true },
          { id: 4, selected: true },
          { id: 6, selected: true }
        ]);
        expect(inboxSelectionService.isSelecting()).to.be.true;
      });
    });
  });
});
