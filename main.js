function log (msg) {
	$('#out').append($('<li>').text(msg));
}

function handler (event) {
	log(event.hotkey + ' -> ' + event.action);
}

$(document).
	hotkeys('action', {name: 'Foo', action: handler, defaultHotkey: 'Alt-M'}).
	hotkeys('action', 'Bar', handler).
	hotkeys('action', 'Baz', handler).
	hotkeys('action', 'Bla', handler).
	hotkeys('removeAction', 'Bla', handler).
	hotkeys('bind', 'Alt-F Alt-G',      'Foo').
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
		$('#compose').empty();
	}).
	on('hotkey', function (event) {
		$('#compose').empty();
		if (typeof console !== "undefined") {
			console.log(event.hotkey + ' -> ' + event.action + ' (via jQuery event system)');
		}
	});

if (typeof console !== "undefined") {
	console.log($(document).hotkeys('bindings'));
	console.log($(document).hotkeys('bindings','Bar'));
	console.log($(document).hotkeys('bindings','Bla'));
	console.log($(document).hotkeys('action','Alt-F Alt-G'));
	console.log($(document).hotkeys('action','Y'));
}

$(document).ready(function () {
	$('#config').hotkeysConfig(document);
	$('#protected-text').hotkeys('block','non-modifier');
	$('#compose-protected-text').hotkeys('block','non-compose');
	$('#full-protected-text').hotkeys('block','all');
});
