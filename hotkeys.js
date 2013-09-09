(function ($, undefined) {
	// $(window).hotkeys('action',  'delete', function (event) { }) -> this
	// $(window).hotkeys('action',  {name: 'delete', label: 'Delete', action: function (event) { }}) -> this
	// $(window).hotkeys('removeAction', 'delete') -> this
	// $(window).hotkeys('bind',    'Ctrl-D',   'delete') -> this
	// $(window).hotkeys('bind',    'Ctrl-M D', 'delete') -> this
	// $(window).hotkeys('unbind',  'Ctrl-M D') -> this
	// $(window).hotkeys('hotkeys') -> ['Ctrl-D', ...]
	// $(window).hotkeys('hotkeys', 'delete') -> ['Ctrl-D']
	// $(window).hotkeys('action',  'Ctrl-D') -> {name: 'delete', lable: 'Delete', action: function () {}} or null
	// $(window).hotkeys('actions') -> ['delete', ...]
	// $(window).hotkeys('clear');

	// hopefully common subset keyboard layout:
	var KeyNames = {
		  8: 'Backspace',
		  9: 'Tab',
		 13: 'Enter',
		 16: 'Shift',
		 17: 'Ctrl',
		 18: 'Alt',
		 19: 'Pause',
		 20: 'Capslock',
		 27: 'Esc',
		 32: 'Space',
		 33: 'Page\u00a0Up',
		 34: 'Page\u00a0Down',
		 35: 'End',
		 36: 'Home',
		 37: 'Left',
		 38: 'Up',
		 39: 'Right',
		 40: 'Down',
		 42: 'Print',
		 45: 'Ins',
		 46: 'Del',
		 91: 'Left\u00a0Meta',
		 92: 'Right\u00a0Meta',
		 93: 'Select',
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
		106: 'Numpad\u00a0*',
		107: 'Numpad\u00a0+',
		108: 'Numpad\u00a0-',
		109: 'Numpad\u00a0.', // could not reproduce
		111: 'Numpad\u00a0/',
		112: 'F1',
		113: 'F2',
		114: 'F3',
		115: 'F4',
		116: 'F5',
		117: 'F6',
		118: 'F7',
		119: 'F8',
		120: 'F9',
		121: 'F10',
		122: 'F11',
		123: 'F12',
		144: 'Numlock',
		145: 'Scroll\u00a0Lock'
	};

	var Keys = {
		// aliases:
		'escape': 27,
		'insert': 45,
		'delete': 46
	};

	(function () {
		for (var ch = '0'.charCodeAt(0), last = 'z'.charCodeAt(0); ch <= last; ++ ch) {
			KeyNames[ch] = String.fromCharCode(ch).toUpperCase();
		}

		for (var key in KeyNames) {
			var name = KeyNames[key].toLowerCase();
			var alias = name.replace(/\u00a0/g,"");
			Keys[name] = key = Number(key);
			if (name !== alias) {
				Keys[alias] = key;
			}
		}
	})();

	var Modifiers = {
		'ctrl':           'ctrlKey',
		'alt':            'altKey',
		'shift':          'shiftKey',
		'meta':           'metaKey',
		'altgr':          'altGraphKey',
		'altgraph':       'altGraphKey',
		'alt\u00a0graph': 'altGraphKey'
	};
	
	var ModifierKeys = {
		 17: 'ctrlKey',
		 18: 'altKey',
		 16: 'shiftKey',
		 91: 'metaKey',
		 92: 'metaKey'
		// XXX: Alt Gr?
	};

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

		var parsed = {
			keyCode:     null,
			metaKey:     false,
			ctrlKey:     false,
			altKey:      false,
			altGraphKey: false,
			shiftKey:    false
		};

		for (var i = 0; i < syms.length; ++ i) {
			var sym = syms[i];
			var keyCode;
			if (Modifiers.hasOwnProperty(sym)) {
				parsed[Modifiers[sym]] = true;
			}
			else if (/^K\+[0-9A-F]+$/i.test(sym)) {
				keyCode = parseInt(sym.slice(2),16);
				if (parsed.keyCode !== null && parsed.keyCode !== keyCode) {
					throw new SyntaxError("illegal hotkey "+hotkey+": hotkey musst contain exactly one non-modifier key");
				}

				parsed.keyCode = keyCode;
			}
			else {
				if (Keys.hasOwnProperty(sym)) {
					keyCode = Keys[sym];
					if (parsed.keyCode !== null && parsed.keyCode !== keyCode) {
						throw new SyntaxError("illegal hotkey "+hotkey+": hotkey musst contain exactly one non-modifier key");
					}
					parsed.keyCode = keyCode;
				}
				else {
					throw new SyntaxError("illegal hotkey "+hotkey+": unknown key name "+sym);
				}
			}
		}

		if (parsed.keyCode === null) {
			throw new SyntaxError("illegal hotkey "+hotkey+": hotkey musst contain exactly one non-modifier key");
		}

		return parsed;
	}

	function parseEvent (event) {
		return {
			keyCode:       event.keyCode,
			metaKey:       event.metaKey,
			ctrlKey:       event.ctrlKey,
			altKey:        event.altKey,
			shiftKey:      event.shiftKey,
			altGraphKey: !!event.originalEvent.altGraphKey // currently buggy
		};
	}

	function makekey (hotkey) {
		var normed = [];
		if (hotkey.metaKey)     normed.push("Meta");
		if (hotkey.ctrlKey)     normed.push("Ctrl");
		if (hotkey.altKey)      normed.push("Alt");
		if (hotkey.altGraphKey) normed.push("Alt\u00a0Gr");
		if (hotkey.shiftKey)    normed.push("Shift");

		if (KeyNames.hasOwnProperty(hotkey.keyCode)) {
			normed.push(KeyNames[hotkey.keyCode]);
		}
		else {
			normed.push('K+'+hotkey.keyCode.toString(16).toUpperCase());
		}

		return normed.join('-');
	}

	function normkey (hotkey) {
		return makekey(parsekey(hotkey));
	}

	function normseq (hotkey_seq) {
		return $.map(parseseq(hotkey_seq), makekey).join(' ');
	}

	function parseseq (hotkey_seq) {
		return $.map($.trim(hotkey_seq).split(/[ \t\r\n\v]+/), parsekey);
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

	function keydown (event) {
		if (ModifierKeys.hasOwnProperty(event.keyCode) && event[ModifierKeys[event.keyCode]]) {
			return;
		}

		var hotkeys = $.data(this,'hotkeys');
		var parsed  = parseEvent(event);
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
			hotkeys.sequence.push({node: node, hotkey: hotkey});
			var hotkey_seq = $.map(hotkeys.sequence, function (el) { return el.hotkey; }).join(' ');
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
		var hotkey_seq = $.map(hotkeys.sequence, function (el) { return el.hotkey; }).join(' ');
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

	function unbind (ctx, hotkey_seq) {
		var hotkeys = ctx.data('hotkeys');
		if (hotkeys) {
			_unbind(hotkeys, $.map($.trim(hotkey_seq).split(/[ \t\r\n\v]+/), normkey), 0);
		}
	}

	function _unbind (node, hotkey_seq, index) {
		var next;
		var hotkey = hotkey_seq[index];
		if (hotkey in node.hotkeys) {
			next = node.hotkeys[hotkey];
			++ index;
			if (index >= hotkey_seq.length) {
				next.action;
				delete next.action;
				if ($.isEmptyObject(next.hotkeys)) {
					delete node.hotkeys[hotkey];
				}
			}
			else {
				_unbind(next, hotkey_seq, index);
				if (!next.action && $.isEmptyObject(next.hotkeys)) {
					delete node.hotkeys[hotkey];
				}
			}
		}
	}

	function allHotkeys (hotkeys) {
		var all = [];
		_allHotkeys(hotkeys.hotkeys, [], all);
		return all;
	}

	function _allHotkeys (hotkeys, comp, all) {
		for (var hotkey in hotkeys) {
			var node = hotkeys[hotkey];
			comp.push(hotkey);
			if (node.action) {
				all.push(comp.join(' '));
			}
			_allHotkeys(node.hotkeys, comp, all);
			comp.pop();
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
				unbind(this, arguments[1]);
				return this;

			case 'hotkeys':
				hotkeys = this.data('hotkeys');
				if (!hotkeys) {
					return [];
				}
				else if (arguments[1]) {
					return actionHotkeys(hotkeys, arguments[1]);
				}
				else {
					return allHotkeys(hotkeys);
				}

			case 'actions':
				hotkeys = this.data('hotkeys');
				if (hotkeys) {
					return keys(hotkeys.actions);
				}
				return [];

			case 'clear':
				hotkeys = this.data('hotkeys');
				if (hotkeys) {
					this.off('blur click',abort).
						off('keydown',keydown).
						removeData('hotkeys');
				}
				return this;

			default:
				throw new TypeError("unknown method: "+method);
		}
	};

	$.fn.hotkeys.norm          = normkey;
	$.fn.hotkeys.normSequence  = normseq;
	$.fn.hotkeys.make          = makekey;
	$.fn.hotkeys.parse         = parsekey;
	$.fn.hotkeys.parseSequence = parseseq;
	$.fn.hotkeys.parseEvent    = parseEvent;
})(jQuery);
