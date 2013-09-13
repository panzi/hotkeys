// TODO: save/load layout
if (!Object.keys) {
	Object.keys = function (obj) {
		var keys = [];
		for (var key in obj) {
			keys.push(key);
		}
		return keys;
	};
}

$(document).ready(function () {
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
			var form = $('<form action="javascript:void(0)">').submit(submitModifierName).appendTo(name);
			$('<input type="text" name="name">').val(modifierName).change(changeModifier).appendTo(form);
			$('<option>',{value:modifier}).text(modifierName).appendTo(select);

			tbody.append(tr);
		}
	}

	initModifiers();

	function isNameValid (name) {
		return /^[^ \t\r\n\v][^- \t\r\n\v]*$/.test(name) && !/^K\+[0-9a-f]+$/i.test(name);
	}

	$("#layout-json").val(JSON.stringify(layout));

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

			addKey(key);
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

	$('#layout tfoot form').submit(function (event) {
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
			altGraphKey: modifier === 'altGraphKey',
			modifiers:   modifier === 'none' ? 0 : 1
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
			addKey(key, keyName);
		}
	});

	function renderKey (key, keyName) {
		var hex = key.keyCode.toString(16).toUpperCase();
		var elem = $('<tr>',{id:'key_'+key.keyCode}).data('key',key);
		$('<td class="code">').text(String(key.keyCode)).appendTo(elem);
		$('<td class="code">').text('0x'+hex).appendTo(elem);
		$('<td class="code">').text('charCode' in key ? key.charCode : '').appendTo(elem);
		var name = $('<td class="name">').appendTo(elem);
		var form = $('<form action="javascript:void(0)">').submit(submitName).appendTo(name);
		var input = $('<input type="text" name="name">').val(keyName).change(changeKey).appendTo(form);
		var mod = $('<td class="modifier">').appendTo(elem);
		var modifier = getModifier(key);
		if (modifier) {
			mod.addClass(modifier).text(layout.modifiers[modifier]);
		}

		var del = $('<td class="delete">').appendTo(elem);
		$('<button type="button">').text('Delete').click(deleteKey).appendTo(del);

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

	function addKey (key, keyName) {
		var elem = $("#key_"+key.keyCode);
	
		if (elem.length === 0) {
			var tbody = $("#layout tbody");
			var hasChar = 'charCode' in key;
			var modifier = getModifier(key);
			var hex = key.keyCode.toString(16).toUpperCase();
			var defaultName = 'K+'+hex;
			var valid;

			if (keyName) {
				valid = keyName === defaultName || isNameValid(keyName);
			}
			else {
				keyName = hasChar ?
					String.fromCharCode(key.charCode).toUpperCase() : defaultName;

				valid = keyName === defaultName || isNameValid(keyName);
				if (!valid) keyName = defaultName;
			}

			elem = renderKey(key, keyName);
			
			if (modifier) {
				layout.modifierKeys[key.keyCode] = modifier;
			}

			if (valid) {
				var unique = true;
				var otherKey;
				var lower = keyName.toLowerCase();
				for (otherKey in layout.keys) {
					var otherName = layout.keys[otherKey].toLowerCase();
					if (otherName === lower) {
						unique = false;
						break;
					}
				}

				if (unique) {
					layout.keys[key.keyCode] = keyName;
				}
				else {
					elem.find('input[name=name]').addClass('not-unique').
						attr('title', "This name is already used by key "+
						otherKey+" (0x"+otherKey.toString(16).toUpperCase()+")");
				}
			}

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

			$("#layout-json").val(JSON.stringify(layout));
			elem.find('input[name=name]').focus().select();
		}
		else {
			elem.find('input[name=name]').val(keyName).change().focus().select();
		}
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
	
	function changeKey (event) {
		var elem = $(this);
		var key = elem.parents('tr').data('key');
		var keyCode = key.keyCode;
		var def = 'K+'+keyCode.toString(16).toUpperCase();
		if (this.value) {
			var isdef = def === this.value.toUpperCase();
			if (!isdef && !isNameValid(this.value)) {
				elem.addClass('invalid').removeClass('not-unique');
				return;
			}

			if (isdef) {
				delete layout.keys[key.keyCode];
				this.value = def;
			}
			else {
				var unique = true;
				var otherKey;
				var lower = this.value.toLowerCase();
				for (otherKey in layout.keys) {
					if (Number(otherKey) !== keyCode && layout.keys[otherKey].toLowerCase() === lower) {
						unique = false;
						break;
					}
				}

				if (unique) {
					layout.keys[key.keyCode] = this.value;
				}
				else {
					elem.removeClass('invalid').addClass('not-unique').
						attr('title', "This name is already used by key "+
						otherKey+" (0x"+otherKey.toString(16).toUpperCase()+")");
					return;
				}
			}
		}
		else {
			delete layout.keys[key.keyCode];
			this.value = def;
		}
		elem.removeClass('invalid not-unique');
		
		$("#layout-json").val(JSON.stringify(layout));
	}

	function submitModifierName (event) {
		event.preventDefault();
	}

	function changeModifier (event) {
		var modifier = $(this).parents('tr').data('modifier');
		var name = layout.modifiers[modifier] = this.value;

		$('#layout .'+modifier+', #new-key-modifier option[value='+modifier+']').text(name);

		$("#layout-json").val(JSON.stringify(layout));
	}

	function deleteKey (event) {
		var elem = $(this).parents('tr').first();
		var key = elem.data('key');
		delete layout.keys[key.keyCode];
		delete layout.modifierKeys[key.keyCode];
		elem.remove();

		$("#layout-json").val(JSON.stringify(layout));
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

	$("#clear").click(function (event) {
		if (confirm("Do you really want to clear the layout and loose any changes?")) {
			layout = new Layout();
			$("#layout tbody").empty();
			$("#layout-json").val('');
			initModifiers();
		}
	});
});
