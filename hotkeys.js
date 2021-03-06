(function ($, undefined) {
	function format (fmt, kwargs) {
		var args = arguments;
		var index = 1;
		return fmt.replace(/{([^{}]*)}|{{|}}|{|}/g, function (match, key) {
			if (key !== undefined) {
				if (key) {
					return kwargs[key];
				}
				else {
					return args[index ++];
				}
			}

			switch (match) {
				case '{{': return '{';
				case '}}': return '}';
				case '{': throw new SyntaxError($.hotkeys.strings.unmatched_left);
				case '}': throw new SyntaxError($.hotkeys.strings.unmatched_right);
			}
		});
	}

	var Mac     = /^(Mac|iPhone|iPad|iOS)/i.test(navigator.platform);
	var Windows = /^Win/i.test(navigator.platform);

	// english keyboard layout:
	var defaultLayout = {
		keys: {
			  3: 'Cancel',
			  8: 'Backspace',
			  9: 'Tab',
			 12: 'Clear',
			 13: 'Return',
			 14: 'Enter',
			 16: 'Shift',
			 17: 'Ctrl',
			 18: Mac ? 'Option' : 'Alt',
			 19: 'Pause',
			 20: 'Caps\u00a0Lock',
			 27: 'Escape',
			 32: 'Space',
			 33: 'Page\u00a0Up',
			 34: 'Page\u00a0Down',
			 35: 'End',
			 36: 'Home',
			 37: 'Left',
			 38: 'Up',
			 39: 'Right',
			 40: 'Down',
			 41: 'Select',
			 42: 'Print',
			 43: 'Execute',
			 44: 'Print\u00a0Screen',
			 45: 'Insert',
			 46: 'Delete',
			 47: 'Help',
			 58: ':',
//			 59: ';',
			 60: '<',
//			 61: '=',
			 62: '>',
			 63: '?',
			 64: '@',
			 91: Windows ? 'Left\u00a0Win'  : Mac ? 'Left\u00a0Cmd'  : 'Left\u00a0Meta',
			 92: Windows ? 'Right\u00a0Win' : Mac ? 'Right\u00a0Cmd' : 'Right\u00a0Meta',
			 93: 'Context\u00a0Menu',
			 95: 'Sleep',
			 96: 'Numpad\u00a00',
			 97: 'Numpad\u00a01',
			 98: 'Numpad\u00a02',
			 99: 'Numpad\u00a03',
			100: 'Numpad\u00a04',
			101: 'Numpad\u00a05',
			102: 'Numpad\u00a06',
			103: 'Numpad\u00a07',
			104: 'Numpad\u00a08',
			105: 'Numpad\u00a09',
			106: 'Multiply',
			107: 'Add',
			108: 'Separator',
			109: 'Subtract',
			110: 'Decimal',
			111: 'Divide',
			144: 'Num\u00a0Lock',
			145: 'Scroll\u00a0Lock',
			160: '^',
			161: '!',
			162: '"',
			163: '#',
			164: '$',
			165: '%',
			166: '&',
			167: '_',
			168: '(',
			169: ')',
			170: '*',
			171: '+',
			172: '|',
//			173: '-',
			174: '{',
			175: '}',
			176: '~',
			181: 'Volume\u00a0Mute',
			182: 'Volume\u00a0Down',
			183: 'Volume\u00a0Up',
			186: ';',
			187: '=',
			188: ',',
			189: '-',
			190: '.',
			191: '/',
			192: '´',
			219: '[',
			220: '\\',
			221: ']',
			222: "'",
			224: Windows ? 'Win' : Mac ? 'Cmd' : 'Meta',
			225: 'Alt\u00a0Graph',
//			226: ???, XXX: is it '<', '|' or '\' on IE?
			250: 'Play',
			251: 'Zoom'
		},
		aliases: {
			esc: 27,
			ins: 45,
			del: 46
		},
		modifiers: {
			ctrlKey:     'Ctrl',
			altKey:      Mac ? 'Option' : 'Alt',
			shiftKey:    'Shift',
			metaKey:     Windows ? 'Win' : Mac ? 'Cmd' : 'Meta',
			altGraphKey: 'Alt\u00a0Graph'
		},
		modifierKeys: {
			 16: 'shiftKey',
			 17: 'ctrlKey',
			 18: 'altKey',
			 91: 'metaKey',
			 92: 'metaKey',
			224: 'metaKey',
			225: 'altGraphKey'
		},
		modifierAliases: {
			'cmd':         'metaKey',
			'command':     'metaKey',
			'win':         'metaKey',
			'windows':     'metaKey',
			'meta':        'metaKey',
			'os':          'metaKey',
			'option':      'altKey',
			'altgr':       'altGraphKey',
			'alt\u00a0gr': 'altGraphKey',
		}
	};

	(function () {
		// numerical keys
		for (var ch = '0'.charCodeAt(0), last = '9'.charCodeAt(0); ch <= last; ++ ch) {
			defaultLayout.keys[ch] = String.fromCharCode(ch);
		}

		// alphabetical keys
		for (var ch = 'A'.charCodeAt(0), last = 'Z'.charCodeAt(0); ch <= last; ++ ch) {
			defaultLayout.keys[ch] = String.fromCharCode(ch);
		}

		// function keys
		for (var i = 1; i <= 24; ++ i) {
			defaultLayout.keys[111 + i] = 'F'+i;
		}
	})();

	var currentLayout;
	var Keys;
	var KeyNames;
	var Modifiers;
	var ModifierKeys;
	var ModifierNames;

	function setLayout (layout) {
		currentLayout = layout;
		KeyNames      = $.extend({}, layout.keys);
		Keys          = $.extend({}, layout.aliases);
		Modifiers     = $.extend({}, layout.modifierAliases);
		ModifierKeys  = $.extend({}, layout.modifierKeys);
		ModifierNames = $.extend({}, $.hotkeys.defaultLayout.modifiers, layout.modifiers);

		for (var key in KeyNames) {
			addKey(Keys, Number(key), KeyNames[key]);
		}

		for (var key in ModifierNames) {
			addKey(Modifiers, key, ModifierNames[key]);
		}
	}

	function addKey (keys, key, name) {
		if (!/^[^ \t\r\n\v][^- \t\r\n\v]*$/.test(name)) {
			throw new SyntaxError(format($.hotkeys.strings.key_name_spaces, {name: name}));
		}
		else if (/^K\+[0-9A-F]+$/i.test(name)) {
			throw new SyntaxError(format($.hotkeys.strings.key_name_k_xxx, {name: name}));
		}
		name = name.toLowerCase();
		keys[name.replace(/\u00a0/g,"")] = keys[name] = key;
	}

	function Hotkey () {
		this.keyCode     = null;
		this.metaKey     = false;
		this.ctrlKey     = false;
		this.altKey      = false;
		this.altGraphKey = false;
		this.shiftKey    = false;
	};

	Hotkey.prototype.toString = function () { return makekey(this); };

	function parsekey (hotkey) {
		hotkey = $.trim(hotkey);

		var keys = [];
		var lower = hotkey.toLowerCase();

		if (!lower) {
			throw new SyntaxError($.hotkeys.strings.hotkey_empty);
		}

		var m = /^(.[^-]*)/.exec(lower);
		var key = m[1];
		keys.push(key);
		lower = lower.slice(key.length);

		if (lower) {
			var re = /-(.[^-]*)?/g;
			m = re.exec(lower);

			do {
				var key = m[1];
				if (!key) {
					throw new SyntaxError(format($.hotkeys.strings.hotkey_empty, {hotkey: hotkey}));
				}
				keys.push(key);
				m = re.exec(lower);
			} while (m);
		}

		var parsed = new Hotkey();

		for (var i = 0; i < keys.length; ++ i) {
			var key = keys[i];
			var keyCode;
			if (Modifiers.hasOwnProperty(key)) {
				parsed[Modifiers[key]] = true;
			}
			else if (Keys.hasOwnProperty(key)) {
				keyCode = Keys[key];
				if (parsed.keyCode !== null && parsed.keyCode !== keyCode) {
					throw new SyntaxError(format($.hotkeys.strings.hotkey_non_modifier, {hotkey: hotkey}));
				}
				parsed.keyCode = keyCode;
			}
			else if (/^K\+[0-9A-F]+$/i.test(key)) {
				keyCode = parseInt(key.slice(2),16);
				if (ModifierKeys.hasOwnProperty(keyCode)) {
					parsed[ModifierKeys[keyCode]] = true;
				}
				else if (parsed.keyCode !== null && parsed.keyCode !== keyCode) {
					throw new SyntaxError(format($.hotkeys.strings.hotkey_non_modifier, {hotkey: hotkey}));
				}
				else {
					parsed.keyCode = keyCode;
				}
			}
			else {
				throw new SyntaxError(format($.hotkeys.strings.hotkey_non_modifier, {hotkey: hotkey, key: key}));
			}
		}

		if (parsed.keyCode === null) {
			throw new SyntaxError(format($.hotkeys.strings.hotkey_non_modifier, {hotkey: hotkey}));
		}

		return parsed;
	}

	function parseEvent (event) {
		var hotkey = new Hotkey();

		if (ModifierKeys.hasOwnProperty(event.keyCode)) {
			hotkey.keyCode = null;
		}
		else {
			hotkey.keyCode = event.keyCode;
		}

		hotkey.metaKey  = event.metaKey;
		hotkey.ctrlKey  = event.ctrlKey;
		hotkey.altKey   = event.altKey;
		hotkey.shiftKey = event.shiftKey;
		
		// currently buggy in browsers:
		if ('altGraphKey' in event) {
			hotkey.altGraphKey = event.altGraphKey;
		}
		else if (event.originalEvent) {
			hotkey.altGraphKey = !!event.originalEvent.altGraphKey;
		}

		return hotkey;
	}

	function makekey (hotkey) {
		var normed = [];
		if (hotkey.ctrlKey)     normed.push(ModifierNames.ctrlKey);
		if (hotkey.metaKey)     normed.push(ModifierNames.metaKey);
		if (hotkey.altKey)      normed.push(ModifierNames.altKey);
		if (hotkey.altGraphKey) normed.push(ModifierNames.altGraphKey);
		if (hotkey.shiftKey)    normed.push(ModifierNames.shiftKey);

		if (hotkey.keyCode !== null) {
			if (KeyNames.hasOwnProperty(hotkey.keyCode)) {
				normed.push(KeyNames[hotkey.keyCode]);
			}
			else {
				normed.push('K+'+hotkey.keyCode.toString(16).toUpperCase());
			}
		}

		return normed.join('-');
	}

	function normkey (hotkey) {
		return makekey(parsekey(hotkey));
	}

	function normseq (hotkey_seq) {
		return parseseq(hotkey_seq).toString();
	}

	function parseseq (hotkey_seq) {
		var seq = $.map($.trim(hotkey_seq).split(/[ \t\r\n\v]+/), parsekey);
		seq.toString = sequenceToString;
		return seq;
	}

	function values (obj) {
		var vals = [];
		for (var key in obj) {
			vals.push(obj[key]);
		}
		return vals;
	}

	var keys = Object.keys || function (obj) {
		var keys = [];
		for (var key in obj) {
			keys.push(key);
		}
		return keys;
	};

	function sequenceToString () {
		return $.map(this, makekey).join(' ');
	}

	function keydown (event) {
		var parsed = parseEvent(event);

		if (parsed.keyCode === null) {
			return;
		}

		var hotkeys = $.data(this,'hotkeys');
		var hotkey  = makekey(parsed);

		var node;
		if (hotkeys.sequence.length > 0) {
			node = hotkeys.sequence[hotkeys.sequence.length - 1].node.hotkeys[hotkey];
		}
		else {
			node = hotkeys.hotkeys[hotkey];
		}

		if (node) {
			event.preventDefault();
			event.stopPropagation();
			hotkeys.sequence.push({node: node, hotkey: parsed});
			var hotkey_seq = $.map(hotkeys.sequence, function (el) { return $.extend({},el.hotkey); });
			hotkey_seq.toString = sequenceToString;
			var $target = $(event.target);
			if (node.action) {
				var evt = $.Event(event, {type:'hotkey', hotkey:hotkey_seq, action:node.action});
				hotkeys.sequence = [];
				$target.trigger(evt);
				evt = $.Event(event, {type:'hotkey:action:'+node.action, hotkey:hotkey_seq, action:node.action});
				$target.trigger(evt);
			}
			else {
				var evt = $.Event(event, {type:'hotkey:compose', hotkey:hotkey_seq});
				$target.trigger(evt);
			}
		}
		else if (hotkeys.sequence.length > 0) {
			_abort($(this), hotkeys, event);
		}
	}

	function _abort (ctx, hotkeys, event) {
		var hotkey_seq = $.map(hotkeys.sequence, function (el) { return $.extend({},el.hotkey); });
		hotkey_seq.toString = sequenceToString;
		hotkeys.sequence = [];
		var evt = $.Event(event, {type:'hotkey:abort-composition', hotkey:hotkey_seq});
		ctx.trigger(evt);
	}

	function abort (event) {
		var hotkeys = $.data(this,'hotkeys');
		if (hotkeys.sequence.length > 0) {
			_abort($(this), hotkeys, event);
		}
	}

	function init (ctx) {
		var hotkeys = $.data(ctx,'hotkeys');

		if (!hotkeys) {
			hotkeys = {
				hotkeys:  {},
				sequence: []
			};
			if (ctx !== window) {
				hotkeys.onabort = function (event) {
					var hotkeys = $.data(ctx,'hotkeys');
					if (hotkeys && hotkeys.sequence.length > 0) {
						_abort($(ctx), hotkeys, event);
					}
				};
				$(window).on('blur click',hotkeys.onabort);
			}
			$(ctx).data('hotkeys', hotkeys).on('blur click',abort).keydown(keydown);
		}

		return hotkeys;
	}

	function isValidActionName (name) {
		return /^[-_a-z0-9]+$/i.test(name);
	}

	function bind (node, hotkey_seq, action) {
		if (!action || !isValidActionName(action)) {
			throw new TypeError(format($.hotkeys.strings.illegal_action_name, {action: action}));
		}
		hotkey_seq = $.map($.trim(hotkey_seq).split(/[ \t\r\n\v]+/), normkey);
		for (var i = 0; i < hotkey_seq.length; ++ i) {
			var hotkey = hotkey_seq[i];
			if (hotkey in node.hotkeys) {
				node = node.hotkeys[hotkey];
			}
			else {
				node = node.hotkeys[hotkey] = {hotkeys:{}};
			}
		}
		node.action = action;
	}

	function bindAll (hotkeys, bindings) {
		for (var hotkey in bindings) {
			bind(hotkeys, hotkey, bindings[hotkey]);
		}
	}

	function unbind (ctx, hotkey_seq, action) {
		var hotkeys = $.data(ctx,'hotkeys');
		if (hotkeys) {
			_unbind(hotkeys, $.map($.trim(hotkey_seq).split(/[ \t\r\n\v]+/), normkey), 0, action)
		}
	}

	function _unbind (node, hotkey_seq, index, action) {
		var hotkey = hotkey_seq[index];
		if (hotkey in node.hotkeys) {
			var next = node.hotkeys[hotkey];
			++ index;
			if (index >= hotkey_seq.length) {
				if (!action || next.action === action) {
					delete next.action;
					if ($.isEmptyObject(next.hotkeys)) {
						delete node.hotkeys[hotkey];
					}
				}
			}
			else {
				_unbind(next, hotkey_seq, index, action);
				if (!next.action && $.isEmptyObject(next.hotkeys)) {
					delete node.hotkeys[hotkey];
				}
			}
		}
	}

	function actionHotkeys (hotkeys, action) {
		var all = [];
		_actionHotkeys(hotkeys.hotkeys, action, [], all);
		return all;
	}

	function _actionHotkeys (hotkeys, action, comp, all) {
		for (var hotkey in hotkeys) {
			var node = hotkeys[hotkey];
			comp.push(hotkey);
			if (node.action === action) {
				all.push(comp.join(' '));
			}
			_actionHotkeys(node.hotkeys, action, comp, all);
			comp.pop();
		}
	}

	function actionsWithHotkeys (hotkeys) {
		var actions = {};
		_actionsWithHotkeys(hotkeys.hotkeys, [], actions);
		return actions;
	}
	
	function _actionsWithHotkeys (hotkeys, comp, actions) {
		for (var hotkey in hotkeys) {
			var node = hotkeys[hotkey];
			comp.push(hotkey);
			if (node.action) {
				var action_hotkeys = actions[node.action];
				if (!$.isArray(action_hotkeys)) {
					action_hotkeys = actions[node.action] = [];
				}
				action_hotkeys.push(comp.join(' '));
			}
			_actionsWithHotkeys(node.hotkeys, comp, actions);
			comp.pop();
		}
	}

	function getAction (ctx,hotkey_seq) {
		var node = ctx.data('hotkeys');
		if (!node) return null;
		hotkey_seq = $.map(parseseq(hotkey_seq), makekey);
		for (var i = 0; i < hotkey_seq.length; ++ i) {
			var hotkey = hotkey_seq[i];
			if (hotkey in node.hotkeys) {
				node = node.hotkeys[hotkey];
			}
			else {
				return null;
			}
		}
		return node.action||null;
	}


	function block (elem, what) {
		switch (what||'all') {
			case 'non-modifier':
				elem.keydown(blockNonModifier);
				break;

			case 'non-compose':
				elem.keydown(blockNonCompose);
				break;

			case 'all':
				elem.keydown(blockAll);
				break;

			default:
				throw new TypeError(format($.hotkeys.strings.illegal_block_type, {type: what}));
		}
	}

	function unblock (elem, what) {
		switch (what||'all') {
			case 'non-modifier':
				elem.off('keydown',blockNonModifier);
				break;

			case 'non-compose':
				elem.off('keydown',blockNonCompose);
				break;

			case 'all':
				elem.off('keydown',blockAll);
				break;

			default:
				throw new TypeError(format($.hotkeys.strings.illegal_block_type, {type: what}));
		}
	}

	function blockNonModifier (event) {
		var hotkey = parseEvent(event);
		if (hotkey.keyCode && !(hotkey.ctrlKey || hotkey.altKey || hotkey.metaKey || hotkey.altGraphKey || hotkey.shiftKey)) {
			blockAll.call(this,event);
		}
	}

	function blockNonCompose (event) {
		var hotkey = parseEvent(event);
		if (hotkey.keyCode && !(hotkey.ctrlKey || hotkey.altKey || hotkey.metaKey || hotkey.altGraphKey || hotkey.shiftKey)) {
			// search hotkeys instance:
			var elem = event.target;
			var hotkeys;
			while (elem && (!(hotkeys = $.data(elem,'hotkeys')) || hotkeys.sequence.length === 0)) {
				elem = elem.parentNode;
			}

			if (!hotkeys || hotkeys.sequence.length === 0) {
				event.stopPropagation();
			}
		}
	}

	function blockAll (event) {
		event.stopPropagation();

		// cancel any hotkey sequence:
		var elem = event.target;
		var hotkeys;
		while (elem && (!(hotkeys = $.data(elem,'hotkeys')) || hotkeys.sequence.length === 0)) {
			elem = elem.parentNode;
		}

		if (hotkeys && hotkeys.sequence.length > 0) {
			_abort($(elem), hotkeys, event);
		}
	}

	$.fn.hotkeys = function (method) {
		switch (arguments.length) {
		case 0:
			return this.each(function () {
				init(this);
			});

		case 1:
			if (typeof arguments[0] === 'object') {
				var bindings = arguments[1];
				return this.each(function () {
					bindAll(init(this), bindings);
				});
			}
		}

		switch (method) {
			case 'action':
				return getAction(this,arguments[1]);

			case 'bind':
				if (typeof arguments[1] === 'object') {
					var bindings = arguments[1];
					return this.each(function () {
						bindAll(init(this), bindings);
					});
				}
				else {
					var hotkey = arguments[1];
					var action = arguments[2];
					return this.each(function () {
						bind(init(this), hotkey, action);
					});
				}

			case 'unbind':
				var hotkey = arguments[1];
				var action = arguments[2];
				return this.each(function () {
					unbind(this, hotkey, action);
				});

			case 'bindings':
				var hotkeys = this.data('hotkeys');
				if (!hotkeys) {
					return [];
				}
				else if (arguments[1]) {
					return actionHotkeys(hotkeys, arguments[1]);
				}
				else {
					return actionsWithHotkeys(hotkeys);
				}

			case 'clear':
				return this.each(function () {
					var hotkeys = $.data(this,'hotkeys');
					if (hotkeys) {
						if (hotkeys.onabort) {
							$(window).off('blur click',hotkeys.onabort);
						}
						$(this).off('blur click',abort).off('keydown',keydown).removeData('hotkeys');
					}
				});

			case 'block':
				var what = arguments[1];
				return this.each(function () {
					block($(this), what);
				});

			case 'unblock':
				var what = arguments[1];
				return this.each(function () {
					unblock($(this), what);
				});

			default:
				throw new TypeError(format($.hotkeys.strings.unknown_method, {method: method}));
		}
	};

	$.hotkeys = {
		Hotkey:        Hotkey,
		norm:          normkey,
		normComposed:  normseq,
		stringify:     function (hotkey) { return $.isArray(hotkey) ? $.map(hotkey, makekey).join(' ') : makekey(hotkey); },
		parse:         parsekey,
		parseComposed: parseseq,
		parseEvent:    parseEvent,
		setLayout:     setLayout,
		getLayout:     function () { return currentLayout; },
		isValidActionName: isValidActionName,
		isValidKeyName:    function (name) {
			return /^[^ \t\r\n\v][^- \t\r\n\v]*$/.test(name) && !/^K\+[0-9A-F]+$/i.test(name);
		},
		format:        format,
		defaultLayout: defaultLayout,
		strings: {
			unmatched_left:      'Unmatched left curly bracket "{" in format.',
			unmatched_right:     'Unmatched right curly bracket "}" in format.',
			hotkey_empty:        'Hotkey may not be empty.',
			key_name_spaces:     'Illegal key name {name}: Key names may not include breakable spaces (" \\t\\n\\r\\v") or except for the first character dashes ("-").',
			key_name_k_xxx:      'Illegal key name {name}: Key names may not be ot the format K+XXX (where XXX is a hexadecimal number).',
			key_name_empty:      'Illegal hotkey {hotkey}: Key names may not be empty.',
			key_name_unknown:    'Illegal hotkey {hotkey}: Unknown key name "{key}".',
			hotkey_non_modifier: 'Illegal hotkey {hotkey}: Hotkeys musst contain exactly one non-modifier key.',
			illegal_action_name: 'Illegal action name "{action}": Action names may be non-empty strings consisting only of numbers, english letters "-" and "_".',
			unknown_method:      'Unknown method: {method}',
			illegal_block_type:  'Illegal block type: {type}'
		}
	};

	setLayout(defaultLayout);
})(jQuery);
