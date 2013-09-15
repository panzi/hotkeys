$(document).ready(function () {
	"use strict";

	if (/WebKit/.test(navigator.userAgent)) {
		$(document.body).addClass('webkit');
	}
	else if (/MSIE/.test(navigator.userAgent)) {
		$(document.body).addClass('msie');
	}
	else if (/Gecko/.test(navigator.userAgent)) {
		$(document.body).addClass('moz');
	}

	function Layout () {
		this.keys = {};
		this.modifiers = $.extend({}, $.hotkeys.defaultLayout.modifiers);
		this.modifierKeys = {};
	}

	var layout = new Layout();
	var down  = null;
	var press = null;
	var downKeys = {};

	function initModifiers () {
		var tbody = $("#modifiers tbody").empty();
		var select = $('#new-key-modifier').empty();
		$('<option selected value="none">').appendTo(select);
		for (var modifier in layout.modifiers) {
			var modifierName = layout.modifiers[modifier];
			var tr = $('<tr>').data('modifier',modifier);

			$('<td class="modifier">').text(modifier).appendTo(tr);
			var name = $('<td class="name">').appendTo(tr);
			var form = $('<form>').submit(submitModifierName).appendTo(name);
			$('<input type="text" name="name">').val(modifierName).change(changeModifier).appendTo(form);
			$('<option>',{value:modifier}).text(modifierName).appendTo(select);

			tbody.append(tr);
		}
	}

	initModifiers();

	$(document).hotkeys('bind', {Up: 'prev', Down: 'next', 'Alt-Up': 'prev-dupl', 'Alt-Down': 'next-dupl'}).
	on('hotkey:action:prev-dupl', '#layout tbody input[name=name]', function (event) {
		var cursor = getCursor(event.target);
		var elem = $(event.target).parents('tr').first().prev('tr');
		while (elem.length > 0 && elem.find('input.not-unique, input.invalid').length === 0) {
			elem = elem.prev('tr');
		}
		if (elem.length > 0) {
			elem = elem.find('input[name=name]').focus();
			setCursor(elem[0], cursor);
			elem.scrollIntoViewIfNeeded();
		}
	}).
	on('hotkey:action:next-dupl', '#layout tbody input[name=name]', function (event) {
		var cursor = getCursor(event.target);
		var elem = $(event.target).parents('tr').first().next('tr');
		while (elem.length > 0 && elem.find('input.not-unique, input.invalid').length === 0) {
			elem = elem.next('tr');
		}
		if (elem.length > 0) {
			elem = elem.find('input[name=name]').focus();
			setCursor(elem[0], cursor);
			elem.scrollIntoViewIfNeeded();
		}
	}).
	on('hotkey:action:prev', '#layout tbody input[name=name], #modifiers tbody input[name=name]', function (event) {
		var cursor = getCursor(event.target);
		var elem = $(event.target).parents('tr').first().prev('tr').find('input[name=name]');
		if (elem.length > 0) {
			event.preventDefault();
			elem.focus();
			setCursor(elem[0], cursor);
			elem.scrollIntoViewIfNeeded();
		}
	}).
	on('hotkey:action:next', '#layout tbody input[name=name], #modifiers tbody input[name=name]', function (event) {
		var cursor = getCursor(event.target);
		var elem = $(event.target).parents('tr').first().next('tr').find('input[name=name]');
		if (elem.length > 0) {
			event.preventDefault();
			elem.focus();
			setCursor(elem[0], cursor);
			elem.scrollIntoViewIfNeeded();
		}
	});

	function isNameValid (name) {
		return /^[^ \t\r\n\v][^- \t\r\n\v]*$/.test(name) && !/^K\+[0-9a-f]+$/i.test(name);
	}

	$("#input-keys").blur(function (event) {
		downKeys = {};
		$("#multiple-modifiers").css('visibility','hidden');
		down  = null;
		press = null;
	}).keydown(function (event) {
		press = null;
		down  = getState(event);

		downKeys[down.keyCode] = true;

		if (Object.keys(downKeys).length > 1) {
			$("#multiple-modifiers").css('visibility','visible');
		}
	}).keypress(function (event) {
		press = event;
	}).keyup(function (event) {
		var downCount = Object.keys(downKeys).length;

		delete downKeys[event.keyCode];

		if (downCount > 1) {
			down  = null;
			press = null;
			return;
		}

		$("#multiple-modifiers").css('visibility','hidden');

		if (down) {
			var key = $.extend({},down);
			if (press && press.charCode) {
				key.charCode = press.charCode;
			}

			addKey(key).find('input[name=name]').focus().select();
		}

		down  = null;
		press = null;
	});

	$('#layout-name').change(function (event) {
		if (this.value) {
			layout.name = this.value;
		}
		else {
			delete layout.name;
		}
	});

	$('#has-new-char-code').change(function (event) {
		$('#new-char-code').prop('disabled',!this.checked);	
	});

	$('#layout thead form, #layout tfoot form').submit(function (event) {
		event.preventDefault();

		var $keyCode  = $('#new-key-code').removeClass('invalid');
		var $charCode = $('#new-char-code').removeClass('invalid');
		var $keyName  = $('#new-key-name').removeClass('invalid');
		var $modifier = $('#new-key-modifier').removeClass('invalid');

		var hasChar  = $('#has-new-char-code').prop('checked');
		var keyName  = $keyName.val();
		var modifier = $modifier.val();
		var key = {
			keyCode:     Number($keyCode.val()),
			ctrlKey:     modifier === 'ctrlKey',
			altKey:      modifier === 'altKey',
			shiftKey:    modifier === 'shiftKey',
			metaKey:     modifier === 'metaKey',
			altGraphKey: modifier === 'altGraphKey'
		};

		if (hasChar) {
			key.charCode = Number($charCode.val());
		}

		var valid = true;
		
		if (isNaN(key.keyCode) || key.keyCode < 1) {
			$keyCode.addClass('invalid');
			valid = false;
		}

		if ('charCode' in key && (isNaN(key.charCode) || key.charCode < 1)) {
			$charCode.addClass('invalid');
			valid = false;
		}

		if (!isNameValid(keyName)) {
			$keyName.addClass('invalid');
			valid = false;
		}

		if (valid) {
			addKey(key, keyName).find('input[name=name]').focus().select();
		}
	});

	function renderKey (key, keyName) {
		var hex = key.keyCode.toString(16).toUpperCase();
		var elem = $('<tr>',{id:'key_'+key.keyCode}).data('key',key);
		$('<td class="code">').text(String(key.keyCode)).appendTo(elem);
		$('<td class="code">').text('0x'+hex).appendTo(elem);
		$('<td class="code">').text('charCode' in key ? key.charCode : '').appendTo(elem);
		var name = $('<td class="name">').appendTo(elem);
		var form = $('<form>').submit(submitName).appendTo(name);
		var input = $('<input type="text" name="name">').val(keyName).change(changeKey).appendTo(form);
		var mod = $('<td class="modifier">').appendTo(elem);
		var modifier = getModifier(key);
		if (modifier) {
			mod.addClass(modifier).text(layout.modifiers[modifier]);
		}

		var del = $('<td class="delete">').appendTo(elem);
		$('<button>',{type:'button',title:'Remove key'}).html('&times;').click(deleteKey).appendTo(del);

		return elem;
	}

	function getModifier (key) {
		if (key.ctrlKey) {
			return 'ctrlKey';
		}
		else if (key.altKey) {
			return 'altKey';
		}
		else if (key.shiftKey) {
			return 'shiftKey';
		}
		else if (key.metaKey) {
			return 'metaKey';
		}
		else if (key.altGraphKey) {
			return 'altGraphKey';
		}
		else {
			return null;
		}
	}

	function addKey (key, keyName, ignoreDuplicates, dontSort) {
		var elem = $("#key_"+key.keyCode);
	
		if (elem.length === 0) {
			var tbody = $("#layout tbody");
			var modifier = getModifier(key);
			var hex = key.keyCode.toString(16).toUpperCase();
			var valid;

			if (keyName) {
				valid = isNameValid(keyName);
			}
			else {
				var defaultName = 'K+'+hex;

				if (key.charCode) {
					keyName = String.fromCharCode(key.charCode).toUpperCase();
					valid   = isNameValid(keyName);

					if (!valid) keyName = defaultName;
				}
				else {
					keyName = defaultName;
					valid   = false;
				}
			}

			elem = renderKey(key, keyName);

			if (modifier) {
				layout.modifierKeys[key.keyCode] = modifier;
			}

			if (dontSort) {
				tbody.append(elem);
			}
			else {
				// in layout.keys are only keys with custom key names
				var keys = $.map(tbody.children().toArray(), function (elem) { return $.data(elem,'key').keyCode; });
				keys.push(key.keyCode);
				var index = keys.sort(function (lhs,rhs) { return lhs - rhs; }).indexOf(key.keyCode);

				if (index === 0) {
					tbody.prepend(elem);
				}
				else {
					elem.insertAfter('#key_'+keys[index - 1]);
				}
			}

			if (valid && (ignoreDuplicates || markDuplicates()[keyName.toLowerCase()].length < 2)) {
				layout.keys[key.keyCode] = keyName;
			}
		}
		else {
			var oldKey = elem.data('key');
			var oldModifier = getModifier(oldKey);
			var modifier    = getModifier(key);
			if (oldModifier !== modifier) {
				elem.data('key',key).find('.modifier').text(modifier ? layout.modifiers[modifier] : '');
			}
			
			if (keyName) {
				elem.find('input[name=name]').val(keyName);
			}
		}

		return elem;
	}

	$('#new-key-code, #new-char-code').change(function (event) {
		var code = Number(this.value);
		if (isNaN(code) || code < 1) {
			$(this).addClass('invalid');
		}
		else {
			$(this).removeClass('invalid');
		}
	});

	$('#new-key-name').change(function (event) {
		if (isNameValid(this.value)) {
			$(this).removeClass('invalid');
		}
		else {
			$(this).addClass('invalid');
		}
	});

	function submitName (event) {
		event.preventDefault();

		$("#input-keys").val('').focus();
	}

	function markDuplicates () {
		var rows = $('#layout tbody tr');
		var keyNames = {};
		for (var i = 0; i < rows.length; ++ i) {
			var row = $(rows[i]);
			var input = row.find('input[name=name]');
			if (input.removeClass('not-unique').hasClass('invalid')) continue;
			input.removeAttr('title');
			var name = input.val().toLowerCase();
			var keyCode = row.data('key').keyCode;
			var keys;
			if (name in keyNames) {
				keys = keyNames[name];
			}
			else {
				keys = keyNames[name] = [];
			}
			keys.push({key: keyCode, input: input});
		}
		for (var name in keyNames) {
			var keys = keyNames[name];
			if (keys.length > 1) {
				for (var i = 0; i < keys.length; ++ i) {
					var key = keys[i];
					key.input.addClass('not-unique');
					
					if (keys.length > 2) {
						var otherKeys = [];
						for (var j = 0; j < keys.length; ++ j) {
							if (j !== i) {
								otherKeys.push(keys[j].key);
							}
						}
						key.input.attr('title','This name is already used by the keys: '+otherKeys.join(', '));
					}
					else {
						key.input.attr('title','This name is already used by the key: '+(i === 0 ? keys[1].key : keys[0].key));
					}
				}
			}
		}
		return keyNames;
	}

	function changeKey (event) {
		var elem = $(this).removeClass('invalid');
		var key = elem.parents('tr').data('key');
		var keyCode = key.keyCode;
		var def = 'K+'+keyCode.toString(16).toUpperCase();
		var isdef;
		var valid = true;
		if (this.value) {
			isdef = def === this.value.toUpperCase();
			if (!isdef && !isNameValid(this.value)) {
				valid = false;
				elem.addClass('invalid').attr('title',
					'Key names may not include breakable spaces (" \\t\\n\\r\\v") or except for the first character dashes ("-").');
			}
		}
		else {
			isdef = true;
			delete layout.keys[key.keyCode];
			this.value = def;
		}

		var keyNames = markDuplicates();
		if (!isdef && valid && keyNames[this.value.toLowerCase()].length <= 1) {
			layout.keys[key.keyCode] = this.value;
		}
	}

	function getCursor (input) {
		if ('selectionStart' in input) {
			// Standard-compliant browsers
			return input.selectionStart;
		} else if (document.selection) {
			// IE
			var sel = document.selection.createRange();
			sel.moveStart('character', -input.value.length);
			return sel.text.length;
		}
	}

	function setCursor (input, cursor) {
		if ('selectionStart' in input) {
			input.selectionStart = cursor;
			input.selectionEnd   = cursor;
		}
		else if (document.selection) {
			var sel = document.selection.createRange();
			sel.moveStart('character', -input.value.length);
			sel.moveStart('character', cursor);
			sel.moveEnd('character', 0);
			sel.select();
		}
	}

	function submitModifierName (event) {
		event.preventDefault();
	}

	function changeModifier (event) {
		var modifier = $(this).parents('tr').data('modifier');
		var name = layout.modifiers[modifier] = this.value;

		$('#layout .'+modifier+', #new-key-modifier option[value='+modifier+']').text(name);
	}

	function deleteKey (event) {
		var elem = $(this).parents('tr').first();
		var key = elem.data('key');
		delete layout.keys[key.keyCode];
		delete layout.modifierKeys[key.keyCode];
		elem.remove();
	}

	function getState (event) {
		var state = {
			keyCode:     event.keyCode,
			ctrlKey:     event.ctrlKey,
			altKey:      event.altKey,
			metaKey:     event.metaKey,
			shiftKey:    event.shiftKey,
			altGraphKey: false
		};
		if ('altGraphKey' in event) {
			state.altGraphKey = event.altGraphKey;
		}
		else if (event.originalEvent) {
			state.altGraphKey = !!event.originalEvent.altGraphKey;
		}

		var mods = 0;
		if (state.ctrlKey)     ++ mods;
		if (state.altKey)      ++ mods;
		if (state.metaKey)     ++ mods;
		if (state.shiftKey)    ++ mods;
		if (state.altGraphKey) ++ mods;

		state.modifiers = mods;

		return state;
	}

	$("#clear-layout").click(function (event) {
		if (confirm("Do you really want to clear the layout and lose any changes?")) {
			layout = new Layout();
			$("#layout tbody").empty();
			$("#layout-name").val('');
			initModifiers();
		}
	});
	

	$("#default-layout").click(function (event) {
		if (confirm("Do you really want to load the default layout and lose any changes?")) {
			loadLayout($.hotkeys.defaultLayout);
		}
	});

	function loadLayout (newLayout) {
		layout = $.extend(true, new Layout(), newLayout);
		$("#layout tbody").empty();
		$("#layout-name").val(layout.name||'');
		initModifiers();

		var keyCodes = [];
		for (var keyCode in layout.keys) {
			keyCodes.push(Number(keyCode));
		}
		keyCodes.sort(function (lhs, rhs) { return lhs - rhs; });

		for (var i = 0; i < keyCodes.length; ++ i) {
			var keyCode = keyCodes[i];
			var key = {
				keyCode:     keyCode,
				ctrlKey:     false,
				altKey:      false,
				metaKey:     false,
				shiftKey:    false,
				altGraphKey: false
			};
			var modifier = layout.modifierKeys[keyCode];
			if (modifier) {
				key[modifier] = true;
			}
			addKey(key, layout.keys[keyCode], true, true);
		}
		markDuplicates();
	}

	if (window.saveAs) {
		$('#save-layout').show().click(function (event) {
			var blob = new Blob([JSON.stringify(layout)],{type: "application/json"});
			window.saveAs(blob, (layout.name||'layout')+'.json');
		});
	}

	if (!window.FileReader) {
		window.FileReader = window.MozFileReader || window.WebKitFileReader || window.MSFileReader;
	}
	
	if (window.FileReader) {
		$('#open-layout').show().find('input[type=file]').change(function (event) {
			if (this.files.length !== 1) {
				alert("Please select a file to open.");
				return;
			}

			layout = new Layout();
			$("#layout tbody").empty();
			$("#layout-name").val('');

			var file = this.files[0];
			var reader = new FileReader();

			reader.onload = function (event) {
				try {
					var newLayout = JSON.parse(event.target.result);

					if (typeof newLayout !== 'object') {
						throw new TypeError("Not a layout file");
					}

					loadLayout(newLayout);
				}
				catch (e) {
					var msg = String(e);

					if (file.name) {
						alert("Error reading file \u00bb"+file.name+"\u00ab: "+msg);
					}
					else {
						alert("Error reading file: "+msg);
					}
				}
			};

			reader.onerror = function (event) {
				var msg;

				switch (this.error.code) {
					case FileError.ABORT_ERR:
						msg = 'Aborted';
						break;

					case FileError.ENCODING_ERR:
						msg = 'Encoding Error';
						break;

					case FileError.NOT_FOUND_ERR:
						msg = 'File not found';
						break;

					case FileError.NOT_READABLE_ERR:
						msg = 'File is not readable';
						break;

					case FileError.NO_MODIFICATION_ALLOWED_ERR:
						msg = 'File is not writeable';
						break;

					case FileError.SECURITY_ERR:
						msg = 'Security Error';
						break;

					default:
						msg = 'Error code ' + this.error.code;
				}

				if (file.name) {
					alert("Error reading file \u00bb"+file.name+"\u00ab: "+msg);
				}
				else {
					alert("Error reading file: "+msg);
				}
			};

			reader.readAsText(file);

			// clear file input so we get a change event even if the same file is opened twice:
			$(this).clone().replaceAll(this);
		});
	}
});
