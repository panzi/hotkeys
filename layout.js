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

	// TODO: check uniquness of names
	var layout = new Layout();
	var down  = null;
	var press = null;

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

	function nameOk (name) {
		return /^[^ \t\r\n\n][^- \t\r\n\n]*$/.test(name) && !/^K\+[0-9a-f]+$/i.test(name);
	}

	$("#layout-json").val(JSON.stringify(layout));

	$("#input-keys").keydown(function (event) {
		press = null;
		down  = getState(event);

		if (down.modifiers > 1) {
			$("#multiple-modifiers").css('visibility','visible');
		}
	}).keypress(function (event) {
		press = event;
	}).keyup(function (event) {
		$("#multiple-modifiers").css('visibility','hidden');

		if (down && down.modifiers <= 1) {
			var key = $("#key_"+down.keyCode);
	
			if (key.length === 0) {
				var tbody = $("#layout tbody");
				var hasChar = !!(press && press.charCode);

				if (hasChar) down.charCode = press.charCode;

				key = $('<tr>',{id:'key_'+down.keyCode}).data('key',down);
				var hex = down.keyCode.toString(16).toUpperCase();
				var keyName = hasChar ?
					String.fromCharCode(press.charCode).toUpperCase() : 'K+'+hex;
				var ok = hasChar && nameOk(keyName);
				if (!ok) keyName = 'K+'+hex;

				$('<td class="code">').text(String(down.keyCode)).appendTo(key);
				$('<td class="code">').text('0x'+hex).appendTo(key);
				$('<td class="code">').text(hasChar ? press.charCode : '').appendTo(key);
				var name = $('<td class="name">').appendTo(key);
				var form = $('<form action="javascript:void(0)">').submit(submitName).appendTo(name);
				$('<input type="text" name="name">').val(keyName).change(changeKey).appendTo(form);

				var modifier;
				if (down.ctrlKey) {
					modifier = layout.modifierKeys[down.keyCode] = 'ctrlKey';
				}
				else if (down.altKey) {
					modifier = layout.modifierKeys[down.keyCode] = 'altKey';
				}
				else if (down.shiftKey) {
					modifier = layout.modifierKeys[down.keyCode] = 'shiftKey';
				}
				else if (down.metaKey) {
					modifier = layout.modifierKeys[down.keyCode] = 'metaKey';
				}
				else if (down.altGraphKey) {
					modifier = layout.modifierKeys[down.keyCode] = 'altGraphKey';
				}

				var mod = $('<td class="modifier">').appendTo(key);

				if (modifier) {
					mod.addClass(modifier).text(layout.modifiers[modifier]);
					layout.modifierKeys[down.keyCode] = modifier;
				}

				var del = $('<td class="delete">').appendTo(key);
				$('<button type="button">').text('Delete').click(deleteKey).appendTo(del);

				if (ok) {
					layout.keys[down.keyCode] = keyName;
				}

				var keys = $.map(tbody.children().toArray(), function (elem) { return $.data(elem,'key').keyCode; });
				keys.push(down.keyCode);
				var index = keys.sort().indexOf(down.keyCode);

				if (index === 0) {
					tbody.prepend(key);
				}
				else {
					key.insertAfter('#key_'+keys[index - 1]);
				}

				$("#layout-json").val(JSON.stringify(layout));
			}

			key.find('input[name=name]').focus().select();
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

	function submitName (event) {
		event.preventDefault();

		$("#input-keys").val('').focus();
	}
	
	function changeKey (event) {
		var elem = $(this);
		var key = elem.parents('tr').data('key');
		var def = 'K+'+key.keyCode.toString(16).toUpperCase();
		if (this.value) {
			var isdef = def === this.value.toUpperCase();
			if (!isdef && !nameOk(this.value)) {
				elem.addClass('invalid');
				return;
			}

			if (isdef) {
				delete layout.keys[key.keyCode];
				this.value = def;
			}
			else {
				layout.keys[key.keyCode] = this.value;
			}
		}
		else {
			delete layout.keys[key.keyCode];
			this.value = def;
		}
		elem.removeClass('invalid');
		
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
