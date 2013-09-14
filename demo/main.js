function log (msg) {
	$('#out').append($('<li>').text(msg));
}

function handler (event) {
	if (typeof console !== "undefined") {
		console.log(event.hotkey + ' -> ' + event.action);
	}
}

$(document).
	hotkeys('bind', 'Alt-F Alt-G',      'foo').
	hotkeys('bind', 'Ctrl-M D',         'bar').
	hotkeys('bind', 'Ctrl-Alt-Shift-J', 'bar').
	hotkeys('bind', 'PageUp',           'XXX').
	hotkeys('bind', 'Alt-Left',         'bar').
	hotkeys('bind', 'Esc',              'baz').
	hotkeys('bind', 'X',                'baz').
	hotkeys('bind', 'Y',                'baz').
	hotkeys('unbind', 'Y').
	on('hotkey:compose', function (event) {
		$('#compose').text(event.hotkey + ' ...');
	}).
	on('hotkey:abort-composition', function (event) {
		$('#compose').empty();
	}).
	on('hotkey:action:foo', handler).
	on('hotkey:action:bar', handler).
	on('hotkey:action:baz', handler).
	on('hotkey', function (event) {
		$('#compose').empty();
		log(event.hotkey + ' -> ' + event.action + ' (' + $('#config').hotkeysConfig('action',event.action).label + ')');
	});

if (typeof console !== "undefined") {
	console.log($(document).hotkeys('bindings'));
	console.log($(document).hotkeys('bindings','Bar'));
	console.log($(document).hotkeys('bindings','Bla'));
	console.log($(document).hotkeys('action','Alt-F Alt-G'));
	console.log($(document).hotkeys('action','Y'));
}

$(document).ready(function () {
	$('#config').hotkeysConfig({
		context: document,
		actions: {
			foo: {label: 'Foo', defaultHotkey: 'Alt-M'},
			bar: 'Bar',
			baz: 'Bla Bla'
		}
	});
	$('#protected-text').hotkeys('block','non-modifier');
	$('#compose-protected-text').hotkeys('block','non-compose');
	$('#full-protected-text').hotkeys('block','all');
});
