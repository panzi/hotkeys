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
		$('#compose').empty();
	}).
	on('hotkey', function (event) {
		$('#compose').empty();
		log(event.hotkey + ' -> ' + event.action + ' (via jQuery event system)');
	});

console.log($(window).hotkeys('bindings'));
console.log($(window).hotkeys('bindings','Bar'));
console.log($(window).hotkeys('bindings','Bla'));
console.log($(window).hotkeys('action','Alt-F'));
console.log($(window).hotkeys('action','Y'));

$(document).ready(function () {
	$('#config').hotkeysConfig(window);
	$('#protected-text').hotkeys('block');
	$('#full-protected-text').hotkeys('block',true);
});
