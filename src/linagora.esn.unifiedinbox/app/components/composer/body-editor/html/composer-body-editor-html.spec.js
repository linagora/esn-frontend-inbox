'use strict';

/* global chai: false, sinon: false */

const { expect } = chai;

describe('The inboxComposerBodyEditorHtml component', function() {

  var $q, $rootScope, $compile, $scope, element, controller;

  function compileComponent() {
    element = angular.element(
      '<inbox-composer-body-editor-html message="message" identity="identity" send="send()" on-body-update="message.htmlBody = $body" />'
    );
    element.appendTo(document.body);

    var compiled = $compile(element)($scope);

    $rootScope.$digest();
    controller = compiled.controller('inboxComposerBodyEditorHtml');

    return element;
  }

  function ctrlEnterEvent() {
    var ctrlEnterEvent = new jQuery.Event('keydown');

    ctrlEnterEvent.which = 13;
    ctrlEnterEvent.keyCode = 13;
    ctrlEnterEvent.ctrlKey = true;

    return ctrlEnterEvent;
  }

  function cmdEnterEvent() {
    var cmdEnterEvent = new jQuery.Event('keydown');

    cmdEnterEvent.which = 13;
    cmdEnterEvent.keyCode = 13;
    cmdEnterEvent.metaKey = true;

    return cmdEnterEvent;
  }

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  beforeEach(angular.mock.module('linagora.esn.unifiedinbox'));

  beforeEach(angular.mock.inject(function(_$q_, _$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $q = _$q_;
  }));

  beforeEach(function() {
    $rootScope.message = {};
    $rootScope.identity = {
      htmlSignature: 'my signature'
    };

    $scope = $rootScope.$new();
  });

  describe('component', function() {

    let $filter;

    beforeEach(angular.mock.inject(function(_$filter_) {
      $filter = _$filter_;
    }));

    it('should add a new inbox-composer-attachments component inside the body', function() {
      expect(compileComponent().find('.note-editable + inbox-composer-attachments')).to.have.length(1);
    });

    it('should add the identity to the body when composing from scratch', function() {
      compileComponent();

      expect(element.find('.note-editable .openpaas-signature').html()).to.equal('-- \nmy signature');
    });

    it('should update the identity when it changes', function() {
      compileComponent();

      $rootScope.identity = {
        htmlSignature: 'another signature'
      };
      $rootScope.$digest();

      expect(element.find('.note-editable .openpaas-signature').html()).to.equal('-- \nanother signature');
    });

    it('should send the message when ctrl+enter is pressed in body', function(done) {
      $rootScope.send = done;

      compileComponent();

      element.find('.note-editable').trigger(ctrlEnterEvent());
    });

    it('should send the message when cmd+enter is pressed in body', function(done) {
      $rootScope.send = done;

      compileComponent();

      element.find('.note-editable').trigger(cmdEnterEvent());
    });

    it('should force tabindex=-1 on all toolbar form input', function(done) {
      compileComponent();

      element.find('.note-toolbar a').each(function() {
        if ($(this).attr('tabindex') !== '-1') {
          done(new Error('Input element has a positive tabindex'));
        }
      });

      done();
    });

    it.skip('should insert text on blur if the summernote body is empty', function() {
      $rootScope.identity = {};
      compileComponent();

      element.find('.summernote').summernote('focus');
      element.find('.summernote').summernote('insertText', 'some other text');
      element.find('.note-editable').blur();

      $rootScope.$digest();

      expect($rootScope.message.htmlBody).to.equal('<p>some other text<br></p>');
    });

    it.skip('should call onBodyUpdate on blur', function() {
      compileComponent();

      element.find('.summernote').summernote('focus');
      element.find('.summernote').summernote('insertText', 'some other text');
      element.find('.note-editable').blur();
      $rootScope.$digest();

      expect($rootScope.message.htmlBody).to.equal('<p>some other text<br></p><div class="openpaas-signature">-- \nmy signature</div>');
    });

    it('should call onBodyUpdate on init', function() {
      compileComponent();

      $rootScope.$digest();

      expect($rootScope.message.htmlBody).to.equal('<p><br></p><div class="openpaas-signature">-- \nmy signature</div>');
    });

    it('should call sanitizeStylisedHtml filter', function() {
      compileComponent();
      const unsafeHtml = '<script>alert("hi");</script><h1>hello</h1><img src=x onerror=alert(1)//>';
      const onPasteEvent = {
        preventDefault: () => {},
        clipboardData: {
          getData: () => unsafeHtml
        }
      };

      controller.onSummernotePaste(onPasteEvent);
      $rootScope.$digest();

      const trustedValue = $filter('sanitizeStylisedHtml')(unsafeHtml).$$unwrapTrustedValue();

      expect(trustedValue).to.equal('<h1>hello</h1><img src="x" />');

      element.find('.summernote').summernote('focus');
      element.find('.summernote').summernote('insertText', trustedValue);
      element.find('.note-editable').blur();

      expect($rootScope.message.htmlBody).to.equal('<p>&lt;h1&gt;hello&lt;/h1&gt;&lt;img src="x" /&gt;<br></p><div class="openpaas-signature">-- \nmy signature</div>');

    });
  });

  describe('onImageUpload', function() {
    beforeEach(function() {
      compileComponent();

      /*
       * Ugly hack because PhantomJS doesn't correctly support File API event though it's ES5...
       * See https://github.com/ariya/phantomjs/issues/14247#issuecomment-224251395
       * Seriously, the ticket has been opened since 2016...
      */
      if (typeof File !== 'function') {
        window.File = function(bits, name, options) {
          var instance = new Blob(bits, options);

          instance.name = name;
          instance.lastModified = new Date('2018-10-30');
          instance.lastModifiedDate = new Date('2018-10-30');

          return instance;
        };
        window.File.prototype.constructor = window.File;
      }
      /* End of ugly hack */

      window.FileReader = function() {
        this.result = undefined;
        this.onerror = angular.noop;
        this.onload = angular.noop;

        var self = this;

        window.FileReader.prototype.readAsDataURL = sinon.stub().callsFake(function() {
          self.result = 'data:base64;' + ++window.FileReader.idx;
          self.onload();

          return self.result;
        });
      };
      window.FileReader.idx = 0;
    });

    it('should insert the base64 encoded images in summernote and not attach them to the mail', function(done) {
      var image1 = new File(['wdghdxsfhgwdg'], 'file1', { type: 'image/jpeg' });
      var image2 = new File(['dgswdgswdgd'], 'file2', { type: 'image/jpeg' });
      var pdf1 = new File(['dwgdgwdgwdg'], 'file2', { type: 'application/pdf' });
      var pdf2 = new File(['wdgwdgxwfdgh'], 'file2', { type: 'application/pdf' });

      controller.onAttachmentsUpload = undefined;
      sinon.spy($.fn, 'summernote');

      controller.onImageUpload({
        length: 4,
        item: function(i) {
          return [image1, image2, pdf1, pdf2][i];
        }
      }).then(function() {
        expect($.fn.summernote).to.have.been.calledTwice;
        expect($.fn.summernote.firstCall).to.have.been.calledWith('insertImage', 'data:base64;1');
        expect($.fn.summernote.secondCall).to.have.been.calledWith('insertImage', 'data:base64;2');
        done();
      });

      $rootScope.$digest();
    });

    it('should attach files that are not images', function(done) {
      var image1 = new File(['wdghdxsfhgwdg'], 'file1', { type: 'image/jpeg' });
      var image2 = new File(['dgswdgswdgd'], 'file2', { type: 'image/jpeg' });
      var pdf1 = new File(['dwgdgwdgwdg'], 'file3', { type: 'application/pdf' });
      var pdf2 = new File(['wdgwdgxwfdgh'], 'file4', { type: 'application/pdf' });

      controller.onAttachmentsUpload = sinon.stub().returns($q.when());

      controller.onImageUpload({
        length: 4,
        item: function(i) {
          return [image1, image2, pdf1, pdf2][i];
        }
      }).then(function() {
        expect(controller.onAttachmentsUpload).to.have.been.calledOnce;
        expect(controller.onAttachmentsUpload.firstCall).to.have.been
          .calledWith(sinon.match({ attachments: sinon.match.array.contains([pdf1, pdf2]) }));
        done();
      });

      $rootScope.$digest();
    });
  });
});
