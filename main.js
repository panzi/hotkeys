
function log (msg) {
	$('#out').append($('<li>').text(msg));
}

function handler (event) {
	log(event.hotkey + ' -> ' + event.action + ' (via hotkeys action)');
}

$(window).
	hotkeys('action', {name: 'Foo', action: handler, defaultHotkey: 'Alt-M'}).
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
		$('#compose').text(event.hotkey + ' ...');
	}).
	on('hotkey:abort-composition', function (event) {
		$('#compose').text('');
	}).
	on('hotkey', function (event) {
		$('#compose').text('');
		log(event.hotkey + ' -> ' + event.action + ' (via jQuery event system)');
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
			var tr = $('<tr>',{'class':'action','data-action':actionName});
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

	$('#protected-text').hotkeys('protect');
	$('#full-protected-text').hotkeys('protect',true);
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

	var compose = $('<button>',{'class':'compose',title:'Add composition hotkey'}).text('+').click(composeHotkey).appendTo(li);
	var remove  = $('<button>',{'class':'remove',title:'Remove hotkey'}).html('&times;').click(removeHotkey).appendTo(li);

	if (!hotkey) {
		compose.hide();
		remove.hide();
	}

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
	var actionEl   = $(this).parents('.action');
	var hotkeysEl  = actionEl.first().find('.hotkeys').empty();
	var actionName = actionEl.attr('data-action');
	var action = $(window).hotkeys('actions')[actionName];

	if (action && action.defaultHotkey) {
		hotkeysEl.append(renderHotkey(action.defaultHotkey));
	}
}

function keydownHotkey (event) {
	event.preventDefault();
	event.stopPropagation();

	var hotkey = $.hotkeys.parseEvent(event);
	var btn = $(this);

	if (hotkey.keyCode === 0) {
		hotkey.keyCode = null;
		hotkey = String(hotkey);
		btn.text((hotkey ? hotkey + '-' : '') + 'Unsupported\u00a0Key!');
	}
	else if (hotkey.keyCode === null) {
		hotkey = String(hotkey);
		btn.text(hotkey ? hotkey + '-...' : '...');
	}
	else {
		var hotkeyEl = btn.parents('li').first();
		var actionName = hotkeyEl.parents('.action').attr('data-action');
		var oldhotkey = hotkeyEl.attr('data-hotkey');
		var hotkey_seq = [];
		var self = this;

		hotkey = String(hotkey);
		hotkeyEl.find('button.change').each(function () {
			hotkey_seq.push(this === self ? hotkey : $.attr(this,'data-hotkey'));
		});
		hotkey_seq = hotkey_seq.join(' ');
		var ctx = $(window);
		var other = ctx.hotkeys('action',hotkey_seq);

		if (other === actionName) {
			if (hotkey_seq !== oldhotkey) {
				hotkeyEl.remove();
			}
		}
		else if (other) {
			var otherAction = ctx.hotkeys('actions')[other];
			if (confirm(
					'The hotkey '+hotkey_seq+' is already assigned to the action "'+
					(otherAction ? otherAction.label : other)+
					'". Do you want to reasign the hotkey?')) {
				ctx.hotkeys('unbind',hotkey_seq,other);
				hotkeyEl.parents('.hotkey-config').first().find('li[data-hotkey]').filter(
					function () { return $.attr(this,'data-hotkey') === hotkey_seq; }).remove();
			}
			else {
				btn.text('...');
				return;
			}
		}

		btn.off('keydown',keydownHotkey).off('keyup',keyupHotkey).off('blur',blurHotkey).text(hotkey).attr('data-hotkey',hotkey);
		if (oldhotkey) {
			ctx.hotkeys('unbind',oldhotkey);
		}

		hotkeyEl.attr('data-hotkey',hotkey_seq).find('.compose, .remove').show();
		// prevent this event to call hotkey
		setTimeout(function () {
			ctx.hotkeys('bind', hotkey_seq, actionName);
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
