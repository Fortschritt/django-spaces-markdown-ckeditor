/**
 * @file
 * Written by Henri MEDOT <henri.medot[AT]absyx[DOT]fr>
 * http://www.absyx.fr
 *
 * Portions of code:
 * Copyright (c) 2003-2010, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

(function($) {

  // Get a CKEDITOR.dialog.contentDefinition object by its ID.
  var getById = function(array, id, recurse) {
    for (var i = 0, item; (item = array[i]); i++) {
      if (item.id == id) return item;
      if (recurse && item[recurse]) {
        var retval = getById(item[recurse], id, recurse);
        if (retval) return retval;
      }
    }
    return null;
  };

  var resetInitValues = function(dialog) {
    dialog.foreach(function(contentObj) {
      contentObj.setInitValue && contentObj.setInitValue();
    });
  };

  var initAutocomplete = function(input, uri) {
    input.setAttribute('autocomplete', 'OFF');
	var ACDB = function (uri) { // ACDB from Drupal autocomplete.js
		  this.uri = uri;
		  this.delay = 300;
		  this.cache = {};
	}

	ACDB.prototype.cancel = function () {
	  if (this.owner) this.owner.setStatus('cancel');
	  if (this.timer) clearTimeout(this.timer);
	  this.searchString = '';
	};

	ACDB.prototype.search = function (searchString) {
	  var db = this;
	  this.searchString = searchString;
	  // See if this string needs to be searched for anyway.
	  searchString = searchString.replace(/^\s+|\s+$/, '');
	  if (searchString.length <= 0 ||
	    searchString.charAt(searchString.length - 1) == ',') {
	    return;
	  }

	  // See if this key has been searched for before.
	  if (this.cache[searchString]) {
	    return this.owner.found(this.cache[searchString]);
	  }

	  // Initiate delayed search.
	  if (this.timer) {
	    clearTimeout(this.timer);
	  }
	  this.timer = setTimeout(function () {
	    db.owner.setStatus('begin');

	    // Ajax GET request for autocompletion.
	    $.ajax({
	      type: 'GET',
	      url: db.uri + encodeURIComponent(searchString),
	      dataType: 'json',
	      success: function (matches) {
	        if (typeof matches.status == 'undefined' || matches.status != 0) {
			  matches = JSON.parse(matches.pages);
	          db.cache[searchString] = matches;
	          // Verify if these are still the matches the user wants to see.
	          if (db.searchString == searchString) {
	            db.owner.found(matches);
	          }
	          db.owner.setStatus('found');
	        }
	      },
	      error: function (xmlhttp) {
//	        alert(Drupal.ajaxError(xmlhttp, db.uri));
//	        alert(xmlhttp, db.uri);
	      }
	    });
	  }, this.delay);
	};

	var jsAC = function (input, db) { // from Drupal autocomplete.js
		var ac = this; 
		this.input = $(input);
		this.ariaLive = $('#' + this.input.id + '-autocomplete-aria-live');
		this.db = db;
 
		$(input)
		    .on('keydown', function (event) { return ac.onkeydown(this, event); })
		    .on('keyup', function (event) { ac.onkeyup(this, event); })
//		    .on('blur', function () { ac.hidePopup(); ac.db.cancel(); });
	}
	jsAC.prototype.onkeydown = function (input, e) {
	  if (!e) {
	    e = window.event;
	  }
	  switch (e.keyCode) {
	    case 40: // down arrow.
	      this.selectDown();
	      return false;
	    case 38: // up arrow.
	      this.selectUp();
	      return false;
	    default: // All other keys.
	      return true;
	  }
	}

	jsAC.prototype.onkeyup = function (input, e) {
	  if (!e) {
	    e = window.event;
	  }
	  switch (e.keyCode) {
	    case 16: // Shift.
	    case 17: // Ctrl.
	    case 18: // Alt.
	    case 20: // Caps lock.
	    case 33: // Page up.
	    case 34: // Page down.
	    case 35: // End.
	    case 36: // Home.
	    case 37: // Left arrow.
	    case 38: // Up arrow.
	    case 39: // Right arrow.
	    case 40: // Down arrow.
	      return true;
 
	    case 9:  // Tab.
	    case 13: // Enter.
	    case 27: // Esc.
	      this.hidePopup(e.keyCode);
	      return true;
 
	    default: // All other keys.
	      if (input.value.length > 0) {
	        this.populatePopup();
	      }
	      else {
	        this.hidePopup(e.keyCode);
	      }
	      return true;
	  }
	}

	jsAC.prototype.hidePopup = function (keycode) {
	  // Select item if the right key or mousebutton was pressed.
	  if (this.selected && ((keycode && keycode !== 46 && keycode !== 8 && keycode !== 27) || !keycode)) {
	    this.input.value = $(this.selected).data('autocompleteValue');
	  }
	  // Hide popup.
	  var popup = this.popup;
	  if (popup) {
	    this.popup = null;
	    $(popup).fadeOut('fast', function () { $(popup).remove(); });
	  }
	  this.selected = false;
	  $(this.ariaLive).empty();
	}

	jsAC.prototype.populatePopup = function () {
	  var $input = $(this.input);
	  var position = $input.position();
	  // Show popup.
	  if (this.popup) {
	    $(this.popup).remove();
	  }
	  this.selected = false;
	  this.popup = $('<div id="autocomplete"></div>')[0];
	  this.popup.owner = this;
	  $(this.popup).css({
//	    top: parseInt(position.top + this.input.offsetHeight, 10) + 'px',
//	    left: parseInt(position.left, 10) + 'px',
//	    width: $input.innerWidth() + 'px',
//	    display: 'none'
	  });
	  $input.before(this.popup);

	  // Do search.
	  this.db.owner = this; 
	  this.db.search(this.input.val());
	};

	jsAC.prototype.found = function (matches) {
	  // If no value in the textfield, do not show the popup.
	  if (!this.input.val().length) {
	    return false;
	  }
	  // Prepare matches.
	  var ul = $('<ul></ul>');
	  var ac = this;	
	  for (key in matches) {
		var obj = matches[key];
		var acVal = obj.title + ' (' + obj.link + ')';
	    $('<li></li>')
	      .html($('<div style="cursor:pointer;"></div>').html(obj.title))
	      .mousedown(function () { ac.select(this); })
//	      .mouseover(function () { ac.highlight(this); })
//	      .mouseout(function () { ac.unhighlight(this); })
	      .data('autocompleteValue', acVal)
	      .appendTo(ul);
	  }

	  // Show popup with matches, if any.
	  if (this.popup) {
	    if (ul.children().size()) {
	      $(this.popup).empty().append(ul).show();
	      $(this.ariaLive).html('Autocomplete popup'); // FIXME: hardcoded English
	    }
	    else {
	      $(this.popup).css({ visibility: 'hidden' });
	      this.hidePopup();
	    }
	  }
	};

	jsAC.prototype.setStatus = function (status) {
	  switch (status) {
	    case 'begin':
	      $(this.input).addClass('throbbing');
	      $(this.ariaLive).html('Suche...'); // FIXME: hardcoded German
	      break;
	    case 'cancel':
	    case 'error':
	    case 'found':
	      $(this.input).removeClass('throbbing');
	      break;
	  }
	};

	jsAC.prototype.select = function (node) {
	  this.input.val($(node).data('autocompleteValue'));
	};

    var jsAC = new jsAC(input, new ACDB(uri));

    // Override Drupal.jsAC.prototype.onkeydown().
    // @see https://drupal.org/node/1991076
    var _onkeydown = jsAC.onkeydown;
    jsAC.onkeydown = function(input, e) {
      if (!e) {
        e = window.event;
      }
      switch (e.keyCode) {
        case 13: // Enter.
          this.hidePopup(e.keyCode);
          return true;
        default: // All other keys.
          return _onkeydown.call(this, input, e);
      }
    };
  };


  var extractPath = function(value) {
    value = CKEDITOR.tools.trim(value);
    var match;
    match = /\(([^\(]*?)\)$/i.exec(value);
    if (match && match[1]) {
      value = match[1];
    }
	var basePath = '';
    if (value.indexOf(basePath) == 0) {
      value = value.substr(basePath.length);
    }
    return value;
  };


  var cache = {}, revertPath = function(value, callback) {
    var path = extractPath(value);
    if (!path) {
      return false;
    }
    if (cache[path] !== undefined) {
      return cache[path];
    }
    $.getJSON(path, function(data) { //TODO: path war ehemals URIEncoded, das hat Django sicher auch
      cache[path] = data;
      callback();
    });
	
  };

  CKEDITOR.plugins.add('collab_path', {
    init: function(editor, pluginPath) {
      CKEDITOR.on('dialogDefinition', function(e) {
        if ((e.editor != editor) || (e.data.name != 'link') /*|| !Drupal.settings.ckeditor_link*/) return;
        // Overrides definition.
        var definition = e.data.definition;
        definition.onFocus = CKEDITOR.tools.override(definition.onFocus, function(original) {
          return function() {
            original.call(this);
            if (this.getValueOf('info', 'linkType') == 'collab') {
              this.getContentElement('info', 'collab_path').select();
            }
          };
        });
        definition.onOk = CKEDITOR.tools.override(definition.onOk, function(original) {
          return function() {
            var process = false;
            if ((this.getValueOf('info', 'linkType') == 'collab') && !this._.selectedElement) {
              var ranges = editor.getSelection().getRanges(true);
              if ((ranges.length == 1) && ranges[0].collapsed) {
                process = true;
              }
            }
            original.call(this);
            if (process) {
              var value = this.getValueOf('info', 'collab_path');
              var index = value.lastIndexOf('(');
              if (index != -1) {
                var text = CKEDITOR.tools.trim(value.substr(0, index));
                if (text) {
                  CKEDITOR.plugins.link.getSelectedLink(editor).setText(text);
                }
              }
            }
          };
        });

        // Overrides linkType definition.
        var infoTab = definition.getContents('info');
        var content = getById(infoTab.elements, 'linkType');
		content.items.unshift(['Beiträge und Ordner suchen', 'collab']);		
        infoTab.elements.push({
          type: 'vbox',
          id: 'collabOptions',
          children: [{
            type: 'text',
            id: 'collab_path',
            label: editor.lang.link.title,
            required: true,
            onLoad: function() {
			  // FIXME: two problems here: 1. hardcoded class, 2. no support for multiple instances (due to .first())
			  var searchURL = $('.CKEditor').first().attr('data-search-url').slice(0,-2);
              this.getInputElement().addClass('form-autocomplete');
              initAutocomplete(this.getInputElement().$, searchURL);
            },
            setup: function(data) {
              this.setValue(data.collab_path || '');
            },
            validate: function() {
              var dialog = this.getDialog();
              if (dialog.getValueOf('info', 'linkType') != 'collab') {
                return true;
              }
              var func = CKEDITOR.dialog.validate.notEmpty(editor.lang.link.noUrl);
              if (!func.apply(this)) {
                return false;
              }
              if (!extractPath(this.getValue())) {
				/*
                alert(Drupal.settings.ckeditor_link.msg_invalid_path);
				*/
                this.focus();
                return false;
              }
              return true;
            }
          }]
        });
        content.onChange = CKEDITOR.tools.override(content.onChange, function(original) {
          return function() {
            original.call(this);
            var dialog = this.getDialog();
            var element = dialog.getContentElement('info', 'collabOptions').getElement().getParent().getParent();
            if (this.getValue() == 'collab') {
              element.show();
              if (editor.config.linkShowTargetTab) {
                dialog.showPage('target');
              }
              var uploadTab = dialog.definition.getContents('upload');
              if (uploadTab && !uploadTab.hidden) {
                dialog.hidePage('upload');
              }
            }
            else {
              element.hide();
            }
          };
        });
        content.setup = function(data) {
          if (!data.type || (data.type == 'url') && !data.url) {
            if (/*Drupal.settings.ckeditor_link.type_selected*/ true) {
              data.type = 'collab';
            }
          }
          else if (data.url && !data.url.protocol && data.url.url) {
            var dialog = this.getDialog();
            var path = revertPath(data.url.url, function() {
              dialog.setupContent(data);
              resetInitValues(dialog);
            });
            if (path) {
              data.type = 'collab';
              data.collab_path = path;
              delete data.url;
            }
          }
          this.setValue(data.type || 'url');
        };
        content.commit = CKEDITOR.tools.override(content.commit, function(original) {
          return function(data) {
            original.call(this, data);
            if (data.type == 'collab') {
              data.type = 'url';
              var dialog = this.getDialog();
              dialog.setValueOf('info', 'protocol', '');
              dialog.setValueOf('info', 'url', extractPath(dialog.getValueOf('info', 'collab_path')));
            }
          };
        });
      });
    }
  });
})(jQuery);