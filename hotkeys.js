(function ($, undefined) {
	// $(window).hotkeys('action',  'delete', function (event) { }) -> this
	// $(window).hotkeys('action',  {name: 'delete', label: 'Delete', action: function (event) { }}) -> this
	// $(window).hotkeys('removeAction', 'delete') -> this
	// $(window).hotkeys('bind',    'Ctrl-D',   'delete') -> this
	// $(window).hotkeys('bind',    'Ctrl-M D', 'delete') -> this
	// $(window).hotkeys('unbind',  'Ctrl-M D') -> this
	// $(window).hotkeys('unbind',  'Ctrl-M D', 'delete') -> this
	// $(window).hotkeys('bindings', 'delete') -> ['Ctrl-D']
	// $(window).hotkeys('bindings') -> {'delete':['Ctrl-D'], ...}
	// $(window).hotkeys('action',  'Ctrl-D') -> {name: 'delete', lable: 'Delete', action: function () {}} or null
	// $(window).hotkeys('actions') -> {'delete': {name: 'delete', lable: 'Delete', ... }, ... }
	// $(window).hotkeys('clear') -> this

	var Mac     = /^(Mac|iPhone|iPad|iOS)/i.test(navigator.platform);
	var Windows = /^Win/i.test(navigator.platform);

	// hopefully common subset keyboard layout:
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
			 91: Windows ? 'Left\u00a0Win'  : Mac ? 'Left\u00a0Cmd'  : 'Left\u00a0Meta',
			 92: Windows ? 'Right\u00a0Win' : Mac ? 'Right\u00a0Cmd' : 'Right\u00a0Meta',
			 93: 'Context\u00a0Menu',
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
			109: 'Subtract',
			110: 'Decimal',
			111: 'Divide',
			144: 'Num\u00a0Lock',
			145: 'Scroll\u00a0Lock',
			162: 'Left\u00a0Control',
			163: 'Right\u00a0Control',
//			164: 'Left\u00a0Alt',
//			165: 'Right\u00a0Alt',
			166: 'Browser\u00a0Back',
			167: 'Browser\u00a0Forward',
			168: 'Browser\u00a0Refresh',
			169: 'Browser\u00a0Stop',
			170: 'Browser\u00a0Search',
			171: 'Browser\u00a0Favorites',
			172: 'Browser\u00a0Home',
			173: 'Volume\u00a0Mute',
			174: 'Volume\u00a0Down',
			175: 'Volume\u00a0Up',
			176: 'Media\u00a0Next\u00a0Track',
			177: 'Media\u00a0Previous\u00a0Track',
			178: 'Media\u00a0Stop',
			179: 'Media\u00a0Play\u00a0Pause',
			180: 'Launch\u00a0Mail',
			181: 'Select\u00a0Media',
			224: Windows ? 'Win' : Mac ? 'Cmd' : 'Meta',
			225: 'Alt\u00a0Gr',
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
			162: 'ctrlKey',
			163: 'ctrlKey',
//			164: 'altKey',
//			165: 'altKey',
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
		// alpha numerical keys
		for (var ch = '0'.charCodeAt(0), last = 'z'.charCodeAt(0); ch <= last; ++ ch) {
			defaultLayout.keys[ch] = String.fromCharCode(ch).toUpperCase();
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

		for (var key in layout.keys) {
			addKey(Keys, Number(key), layout.keys[key]);
		}

		for (var key in layout.modifiers) {
			addKey(Modifiers, key, layout.modifiers[key]);
		}
	}

	function addKey (keys, key, name) {
		if (name !== '-' && /[- \t\n\r\v]/.test(name)) {
			throw new SyntaxError('illegal key name '+name+': key names may not include breakable spaces (" \\t\\n\\r\\v") or dashes ("-").');
		}
		else if (/^K\+[0-9A-F]+$/i.test(name)) {
			throw new SyntaxError('illegal key name '+name+': key names may not be ot the format K+XXX (where XXX is a hexadecimal number).');
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
		if (hotkey.length === 0) {
			throw new SyntaxError("hotkey may not be empty");
		}

		var lower = hotkey.toLowerCase();
		var re = /-(.[^-]*)?/g;
		var m = re.exec(lower);
		var syms = [];

		if (m) {
			syms.push(lower.slice(0,m.index));
			do {
				var sym = m[1];
				if (!sym) {
					throw new SyntaxError("illegal hotkey "+hotkey+": key name may not be empty");
				}
				syms.push(sym);
				m = re.exec(lower);
			} while (m);
		}
		else {
			syms.push(lower);
		}

		var parsed = new Hotkey();

		for (var i = 0; i < syms.length; ++ i) {
			var sym = syms[i];
			var keyCode;
			if (Modifiers.hasOwnProperty(sym)) {
				parsed[Modifiers[sym]] = true;
			}
			else if (Keys.hasOwnProperty(sym)) {
				keyCode = Keys[sym];
				if (parsed.keyCode !== null && parsed.keyCode !== keyCode) {
					throw new SyntaxError("illegal hotkey "+hotkey+": hotkey musst contain exactly one non-modifier key");
				}
				parsed.keyCode = keyCode;
			}
			else if (/^K\+[0-9A-F]+$/i.test(sym)) {
				keyCode = parseInt(sym.slice(2),16);
				if (ModifierKeys.hasOwnProperty(keyCode)) {
					parsed[ModifierKeys[keyCode]] = true;
				}
				else if (parsed.keyCode !== null && parsed.keyCode !== keyCode) {
					throw new SyntaxError("illegal hotkey "+hotkey+": hotkey musst contain exactly one non-modifier key");
				}
				else {
					parsed.keyCode = keyCode;
				}
			}
			else {
				throw new SyntaxError("illegal hotkey "+hotkey+": unknown key name "+sym);
			}
		}

		if (parsed.keyCode === null) {
			throw new SyntaxError("illegal hotkey "+hotkey+": hotkey musst contain exactly one non-modifier key");
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
			if (node.action) {
				var action = hotkeys.actions[node.action];
				var evt = $.Event(event, {type:'hotkey', hotkey:hotkey_seq, action:node.action});
				hotkeys.sequence = [];
				if (action) {
					try {
						action.action.call(this,evt);
					}
					catch (e) {
						if (typeof console !== 'undefined') {
							console.error(e);
						}
					}
				}
				$(this).trigger(evt);
			}
			else {
				var evt = $.Event(event, {type:'hotkey:compose', hotkey:hotkey_seq});
				$(this).trigger(evt);
			}
		}
		else if (hotkeys.sequence.length > 0) {
			_abort(hotkeys, event);
		}
	}

	function _abort (hotkeys, event) {
		var hotkey_seq = $.map(hotkeys.sequence, function (el) { return $.extend({},el.hotkey); });
		hotkey_seq.toString = sequenceToString;
		hotkeys.sequence = [];
		var evt = $.Event(event, {type:'hotkey:abort-composition', hotkey:hotkey_seq});
		$(this).trigger(evt);
	}

	function abort (event) {
		var hotkeys = $.data(this,'hotkeys');
		if (hotkeys.sequence.length > 0) {
			_abort(hotkeys, event);
		}
	}

	function get (ctx) {
		var hotkeys = ctx.data('hotkeys');

		if (!hotkeys) {
			hotkeys = {
				actions:  {},
				hotkeys:  {},
				sequence: []
			};
			ctx.data('hotkeys', hotkeys).on('blur click',abort).keydown(keydown);
		}

		return hotkeys;
	}

	function registerAction (ctx,action) {
		if (!action.name) {
			throw new TypeError("illegal action name: "+action.name);
		}

		if (typeof action.action !== 'function') {
			throw new TypeError("action is not a function: "+action.action);
		}

		var hotkeys = get(ctx);
		if (!action.label) {
			action.label = action.name;
		}
		hotkeys.actions[action.name] = action;
	}

	function bind (ctx, hotkey_seq, action) {
		if (!action) {
			throw new TypeError("illegal action name: "+action);
		}
		hotkey_seq = $.map($.trim(hotkey_seq).split(/[ \t\r\n\v]+/), normkey);
		var node = get(ctx);
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

	function unbind (ctx, hotkey_seq, action) {
		var hotkeys = ctx.data('hotkeys');
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
		for (var action in hotkeys.actions) {
			actions[action] = [];
		}
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

	$.fn.hotkeys = function (method) {
		var hotkeys;
		if (arguments.length === 0) {
			hotkeys = get(this);
			return this;
		}
		switch (method) {
			case 'action':
				if (arguments.length > 2) {
					registerAction(this, {name: arguments[1], action: arguments[2]});
				}
				else if (typeof arguments[1] === "object") {
					registerAction(this, arguments[1]);
				}
				else {
					var node = this.data('hotkeys');
					if (!node) return null;
					var hotkey_seq = $.map(parseseq(arguments[1]), makekey);
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
				return this;

			case 'removeAction':
				hotkeys = this.data('hotkeys');
				if (!hotkeys) return null;
				var action = arguments[1];
				delete hotkeys.actions[action];
				return this;

			case 'bind':
				bind(this, arguments[1], arguments[2]);
				return this;

			case 'unbind':
				unbind(this, arguments[1], arguments[2]);
				return this;

			case 'bindings':
				hotkeys = this.data('hotkeys');
				if (!hotkeys) {
					return [];
				}
				else if (arguments[1]) {
					return actionHotkeys(hotkeys, arguments[1]);
				}
				else {
					return actionsWithHotkeys(hotkeys);
				}

			case 'actions':
				hotkeys = this.data('hotkeys');
				return hotkeys ? hotkeys.actions : {};

			case 'clear':
				hotkeys = this.data('hotkeys');
				if (hotkeys) {
					this.off('blur click',abort).off('keydown',keydown).removeData('hotkeys');
				}
				return this;

			case 'protect':
				return $(this).keydown(arguments[1] ? fullProtectKeydown : protectKeydown);

			case 'unprotect':
				return $(this).off('keydown',arguments[1] ? fullProtectKeydown : protectKeydown);

			default:
				throw new TypeError("unknown method: "+method);
		}
	};

	function protectKeydown (event) {
		var hotkey = parseEvent(event);
		if (hotkey.keyCode && !(hotkey.ctrlKey || hotkey.altKey || hotkey.metaKey || hotkey.altGraphKey || hotkey.shiftKey)) {
			event.stopPropagation();
		}
	}

	function fullProtectKeydown (event) {
		event.stopPropagation();
	}

	$.hotkeys = {
		norm:          normkey,
		normSequence:  normseq,
		stringify:     function (hotkey) { return $.isArray(hotkey) ? $.map(hotkey, makekey).join(' ') : makekey(hotkey); },
		parse:         parsekey,
		parseSequence: parseseq,
		parseEvent:    parseEvent,
		setLayout:     setLayout,
		getLayout:     function () { return currentLayout; },
		defaultLayout: defaultLayout
	};

	setLayout(defaultLayout);
})(jQuery);
