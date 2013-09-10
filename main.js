
function log (msg) {
	$('#out').append($('<li>').text(msg));
}

function handler (event) {
	log(event.hotkey + ' -> ' + event.action + ' (via hotkeys action)');
}

$(window).
	hotkeys('action', {name: 'Foo', action: handler, default: 'Alt-M'}).
	hotkeys('action', 'Bar', handler).
	hotkeys('action', 'Baz', handler).
	hotkeys('action', 'Bla', handler).
	hotkeys('removeAction', 'Bla', handler).
	hotkeys('bind', 'Alt-F',            'Foo').
	hotkeys('bind', 'Ctrl-M D',         'Bar').
	hotkeys('bind', 'Ctrl-Alt-Shift-J', 'Bar').
	hotkeys('bind', 'PageUp',           'Bar').
	hotkeys('bind', 'Alt-Left',         'Bar').
	hotkeys('bind', 'Esc',              'Baz').
	hotkeys('bind', 'X',                'Baz').
	hotkeys('bind', 'Y',                'Baz').
	hotkeys('unbind', 'Y').
	on('hotkey:compose', function (event) {
		$('#compose').text($.hotkeys.stringify(event.hotkey) + ' ...');
	}).
	on('hotkey:abort-composition', function (event) {
		$('#compose').text('');
	}).
	on('hotkey', function (event) {
		$('#compose').text('');
		log($.hotkeys.stringify(event.hotkey) + ' -> ' +
		    event.action + ' (via jQuery event system)');
	});

console.log($(window).hotkeys('bindings'));
console.log($(window).hotkeys('bindings','Bar'));
console.log($(window).hotkeys('bindings','Bla'));
console.log($(window).hotkeys('action','Alt-F'));
console.log($(window).hotkeys('action','Y'));

$(document).ready(function () {
	var tbody = $('#config tbody');
	var bindings = $(window).hotkeys('bindings');
	var actions  = $(window).hotkeys('actions');
	var actionNames = [];
	for (var action in bindings) {
		actionNames.push(action);
	}
	actionNames.sort();
	for (var i = 0; i < actionNames.length; ++ i) {
		var actionName = actionNames[i];
		var action = actions[actionName];
		if (action) {
			var hotkeys = bindings[actionName].sort();
			var tr = $('<tr>',{'data-action':actionName});
			var ul = $('<ul>',{'class':'hotkeys'});

			for (var j = 0; j < hotkeys.length; ++ j) {
				ul.append(renderHotkey(hotkeys[j]));
			}
		
			$('<td>').text(action.label).appendTo(tr);
			$('<td>').append(ul).appendTo(tr);
			$('<td>').append($('<button>',{'class':'add',title:'Add hotkey'}).text('+').click(addHotkey)).appendTo(tr);
			$('<td>').append($('<button>',{'class':'default',title:'Reset to default'}).text('Default').click(resetHotkeys)).appendTo(tr);

			tbody.append(tr);
		}
	}
});

function renderHotkey (hotkey) {
	var li = $('<li>',{'data-hotkey':hotkey});

	if (hotkey) {
		var seq = $.hotkeys.parseSequence(hotkey);
		for (var i = 0; i < seq.length; ++ i) {
			var k = String(seq[i]);
			$('<button>',{'class':'change','data-hotkey':k,title:'Click to change hotkey'}).text(k).click(changeHotkey).appendTo(li);
		}
	}
	else {
		$('<button>',{'class':'change',title:'Click to change hotkey'}).text('...').click(changeHotkey).appendTo(li);
	}
	$('<button>',{'class':'compose',title:'Add composition hotkey'}).text('+').click(composeHotkey).appendTo(li);
	$('<button>',{'class':'remove',title:'Remove hotkey'}).html('&times;').click(removeHotkey).appendTo(li);

	return li;
}

function addHotkey (event) {
	var tr = $(this).parents('tr');
	var li = renderHotkey(null);
	tr.find('ul').append(li);
	li.find('button.change').click();
}

function removeHotkey (event) {
	var li = $(this).parents('li');
	var hotkey = li.attr('data-hotkey');
	if (hotkey) {
		$(window).hotkeys('unbind',hotkey);
	}
	li.remove();
}

function composeHotkey (event) {
	$('<button>',{'class':'change',title:'Click to change hotkey'}).text('...').click(changeHotkey).insertBefore(this).click();
}

function changeHotkey (event) {
	$(this).focus().keydown(keydownHotkey).keyup(keyupHotkey).blur(blurHotkey).text('...');
}

function resetHotkeys (event) {
	// TODO
}

function keydownHotkey (event) {
	event.preventDefault();
	event.stopPropagation();

	var hotkey = $.hotkeys.parseEvent(event);
	var btn = $(this);

	if (hotkey.keyCode === 0) {
		hotkey.keyCode = null;
		hotkey = String(hotkey);
		btn.text(hotkey ? hotkey + '-Unsupported\u00a0Key!' : 'Unsupported\u00a0Key!');
	}
	else if (hotkey.keyCode === null) {
		hotkey = String(hotkey);
		btn.text(hotkey ? hotkey + '-...' : '...');
	}
	else {
		var li = btn.parents('li');
		var old = li.attr('data-hotkey');

		// TODO: check for collision
		hotkey = String(hotkey);
		btn.off('keydown',keydownHotkey).off('keyup',keyupHotkey).off('blur',blurHotkey).text(hotkey).attr('data-hotkey',hotkey);
		if (old) {
			$(window).hotkeys('unbind',old);
		}
		hotkey = [];
		li.find('button.change').each(function () {
			hotkey.push($.attr(this,'data-hotkey'));
		});
		hotkey = hotkey.join(' ');
		li.attr('data-hotkey',hotkey);
		var actionName = li.parents('tr').attr('data-action');
		// prevent this event to call hotkey
		setTimeout(function () {
			$(window).hotkeys('bind',hotkey,actionName);
		}, 0);
	}
}

function keyupHotkey (event) {
	event.preventDefault();
	event.stopPropagation();

	var hotkey = $.hotkeys.parseEvent(event);
	var mods = $.hotkeys.getLayout().modifierKeys;
	if (mods.hasOwnProperty(event.keyCode)) {
		hotkey[mods[event.keyCode]] = false;
		hotkey = String(hotkey);
		$(this).text(hotkey ? hotkey + '-...' : '...');
	}
	else if (event.keyCode === 0) {
		hotkey.keyCode = null;
		hotkey = String(hotkey);
		$(this).text(hotkey ? hotkey + '-...' : '...');
	}
}

function blurHotkey (event) {
	var btn = $(this).off('keydown',keydownHotkey).off('keyup',keyupHotkey).off('blur',blurHotkey);
	var hotkey = btn.attr('data-hotkey');
	if (hotkey) {
		btn.text(hotkey);
	}
	else {
		var li = btn.parents('li');
		btn.remove();
		if (li.find('button.change').length === 0) {
			li.remove();
		}
	}
}
