(function ($, undefined) {
	$.hotkeysConfig = {
		strings: {
			hdr_action:      'Action',
			hdr_shortcuts:   'Shortcuts',
			tooltip_add:     'Add hotkey',
			tooltip_default: 'Reset to default',
			tooltip_change:  'Click to change hotkey',
			tooltip_compose: 'Add composition hotkey',
			tooltip_remove:  'Remove hotkey',
			btn_default:     'Default',
			unsupported_key: 'Unsupported\u00a0Key!',
			confirm_reasign: 'The hotkey {hotkey} is already assigned to the action "{action}".\nDo you want to reasign this hotkey?'
		}
	};

	function getConfig (elem) {
		return elem.parents('.hotkeys-config').data('hotkeys-config');
	}
	
	function getContext (elem) {
		return $(getConfig(elem).context);
	}

	function renderHotkey (hotkey) {
		var li = $('<li>',{'data-hotkey':hotkey});
		var strs = $.hotkeysConfig.strings;

		if (hotkey) {
			var seq = $.hotkeys.parseComposed(hotkey);
			for (var i = 0; i < seq.length; ++ i) {
				var k = String(seq[i]);
				$('<button>',{'class':'change','data-hotkey':k,title:strs.tooltip_change}).
					text(k).click(changeHotkey).appendTo(li);
			}
		}
		else {
			$('<button>',{'class':'change',title:strs.tooltip_change}).
				text('...').click(changeHotkey).appendTo(li);
		}

		var compose = $('<button>',{'class':'compose',title:strs.tooltip_compose}).
			text('+').click(composeHotkey).appendTo(li);

		var remove = $('<button>',{'class':'remove',title:strs.tooltip_remove}).
			html('&times;').click(removeHotkey).appendTo(li);

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
			getContext(li).hotkeys('unbind',hotkey);
		}
		li.remove();
	}

	function composeHotkey (event) {
		$('<button>',{'class':'change',title:$.hotkeysConfig.strings.tooltip_change}).
			text('...').click(changeHotkey).insertBefore(this).click();
	}

	function changeHotkey (event) {
		$(this).focus().keydown(keydownHotkey).keyup(keyupHotkey).blur(blurHotkey).text('...');
	}

	function resetHotkeys (event) {
		var actionEl   = $(this).parents('.action');
		var hotkeysEl  = actionEl.first().find('.hotkeys');
		var actionName = actionEl.attr('data-action');
		var cfg     = getConfig(actionEl);
		var ctx     = $(cfg.context);
		var action  = cfg.actions[actionName];
		var hotkeys = ctx.hotkeys('bindings', actionName);

		if (hotkeys) {
			for (var i = 0; i < hotkeys.length; ++ i) {
				ctx.hotkeys('unbind',hotkeys[i],actionName);
			}
		}

		hotkeysEl.empty();
		if (action && action.defaultHotkey) {
			ctx.hotkeys('bind',action.defaultHotkey,action.name);
			hotkeysEl.append(renderHotkey(action.defaultHotkey));
		}
	}

	function keydownHotkey (event) {
		event.preventDefault();
		event.stopPropagation();

		var hotkey = $.hotkeys.parseEvent(event);
		var btn = $(this);
		var strs = $.hotkeysConfig.strings;

		if (hotkey.keyCode === 0) {
			hotkey.keyCode = null;
			hotkey = String(hotkey);
			btn.text((hotkey ? hotkey + '-' : '') + strs.unsupported_key);
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
			var cfg = getConfig(hotkeyEl);
			var ctx = $(cfg.context);
			var other = ctx.hotkeys('action',hotkey_seq);

			// TODO: check for ambigious prefix?
			if (other === actionName) {
				if (hotkey_seq !== oldhotkey) {
					hotkeyEl.remove();
				}
			}
			else if (other) {
				var otherAction = cfg.actions[other];
				if (confirm($.hotkeys.format(strs.confirm_reasign, {
					hotkey: hotkey_seq,
					action: otherAction ? otherAction.label : other
				}))) {
					ctx.hotkeys('unbind',hotkey_seq,other);
					hotkeyEl.parents('.hotkeys-config').first().find('li[data-hotkey]').filter(
						function () { return $.attr(this,'data-hotkey') === hotkey_seq; }).remove();
				}
				else {
					btn.text('...').focus();
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

	function renderConfig (options) {
		var table = $('<table>',{'class':'hotkeys-config'});
		var thead = $('<thead>').appendTo(table);
		var tbody = $('<tbody>').appendTo(table);

		var cfg = {context: options.context, actions: {}};
		var ctx = $(cfg.context);
		if (options.actions) {
			for (var name in options.actions) {
				setAction(cfg.actions, name, options.actions[name]);
			}
		}
		var bindings = ctx.hotkeys('bindings');
		var hasAction = Object.prototype.hasOwnProperty.bind(cfg.actions);
		for (var name in bindings) {
			if (!hasAction(name)) {
				cfg.actions[name] = {label: name};
			}
		}

		table.data('hotkeys-config',cfg);

		var heading = $('<tr>').appendTo(thead);
		var strs = $.hotkeysConfig.strings;

		$('<th>').text(strs.hdr_action).appendTo(thead);
		$('<th>').text(strs.hdr_shortcuts).appendTo(thead);
		$('<th>').appendTo(thead);
		$('<th>').appendTo(thead);

		var actions = [];
		for (var actionName in cfg.actions) {
			actions.push({name: actionName, action: cfg.actions[actionName]});
		}
		actions.sort(actionSorter);

		for (var i = 0; i < actions.length; ++ i) {
			tbody.append(renderAction(actions[i], bindings, strs));
		}

		return table;
	}

	function renderAction (item, bindings, strs) {
		var hotkeys = (bindings[item.name]||[]).sort();
		var tr = $('<tr>',{'class':'action','data-action':item.name});
		var ul = $('<ul>',{'class':'hotkeys'});

		for (var j = 0; j < hotkeys.length; ++ j) {
			ul.append(renderHotkey(hotkeys[j]));
		}

		$('<td>',{'class':'name-cell'}).text(item.action.label).appendTo(tr);
		$('<td>',{'class':'hotkeys-cell'}).append(ul).appendTo(tr);

		$('<td>',{'class':'add-cell'}).append($('<button>',{'class':'add',title:strs.tooltip_add}).
			text('+').click(addHotkey)).appendTo(tr);

		$('<td>',{'class':'default-cell'}).append($('<button>',{'class':'default',title:strs.tooltip_default}).
			text(strs.btn_default).click(resetHotkeys)).appendTo(tr);

		return tr;
	}

	function actionSorter (lhs,rhs) {
		lhs = lhs.action.label;
		rhs = rhs.action.label;
		return lhs < rhs ? -1 : rhs < lhs ? 1 : 0;
	}

	function setAction (actions, name, action) {
		if (!$.hotkeys.isValidActionName(name)) {
			throw new TypeError(format($.hotkeys.strings.illegal_action_name, {action: name}));
		}
		if (typeof action === "string") {
			action = {label: action};
		}
		var old_action = actions[name];
		if (old_action) {
			action = $.extend(old_action, action);
		}
		else {
			actions[name] = action;
		}
		if (!action.label) {
			action.label = name;
		}
		if ('name' in action) {
			delete action.name;
		}
		return action;
	}


	function updateActions ($cfg, actions, new_actions) {
		var items = [];
		for (var name in new_actions) {
			var action = setAction(actions, name, new_actions[name]);
			items.push({name: name, action: action});
		}
		if (items.length > 0) {
			items.sort(actionSorter);
			var $actions = $cfg.find('.action[data-action]');
			var $tbody = $cfg.children('tbody');
			var strs = $.hotkeysConfig.strings;
			var bindings = $($cfg.data('hotkeys-config').context).hotkeys('bindings');

			var i = 0, j = 0;
			while (i < items.length && j < $actions.length) {
				var item = items[i];
				var item_label = item.action.label;
				var elem = $actions[j];
				var elem_name = $.attr(elem,'data-action');
				var elem_label = actions[elem_name].label;

				if (item.name === elem_name) {
					$(elem).children('.name-cell').text(item_label);
					++ i;
				}
				else if (item_label < elem_label) {
					renderAction(item, bindings, strs).insertBefore(elem);
					++ i;
				}
				else {
					++ j;
				}
			}

			for (; i < items.length; ++ i) {
				$tbody.append(renderAction(items[i], bindings, strs));
			}
		}
	}

	$.fn.hotkeysConfig = function (method) {
		if (arguments.length === 0) {
			var cfg = $cfg.data('hotkeys-config')||{};
			return this.empty().append(renderConfig(cfg));
		}
		else if (typeof method === "object") {
			return this.empty().append(renderConfig(method));
		}

		switch (method) {
			case "actions":
				var $cfg = this.children('.hotkeys-config');
				if (arguments.length === 1) {
					var cfg = $cfg.data('hotkeys-config');
					return cfg ? cfg.actions : {};
				}
				else {
					var cfg = $cfg.data('hotkeys-config')||{};
					if (!cfg.actions) cfg.actions = {};
					updateActions($cfg, cfg.actions, arguments[1]);
					$cfg.data('hotkeys-config',cfg);
					return this;
				}

			case "action":
				var $cfg = this.children('.hotkeys-config');
				if (arguments.length > 2) {
					var cfg = $cfg.data('hotkeys-config')||{};
					var new_actions = {};
					new_actions[arguments[1]] = arguments[2];
					updateActions($cfg, cfg.actions, new_actions);
					$cfg.data('hotkeys-config',cfg);
					return this;
				}
				else if (typeof arguments[1] === "object") {
					var cfg = $cfg.data('hotkeys-config')||{};
					var new_actions = {};
					var action = arguments[1];
					new_actions[action.name] = action;
					updateActions($cfg, cfg.actions, new_actions);
					$cfg.data('hotkeys-config',cfg);
				}
				else {
					var cfg = $cfg.data('hotkeys-config');
					return cfg ? cfg.actions[arguments[1]]||null : null;
				}

			case "removeAction":
				var action = arguments[1];
				if (!$.hotkeys.isValidActionName(action)) {
					throw new TypeError(format($.hotkeys.strings.illegal_action_name, {action: action}));
				}
				var $cfg = this.children('.hotkeys-config');
				var cfg = $cfg.data('hotkeys-config');
				if (cfg) {
					delete cfg.actions[action];
				}
				$cfg.find('.action[data-action="'+action+'"]').remove();
				return this;

			case "clear":
				return this.empty();

			default:
				throw new TypeError(format($.hotkeys.strings.unknown_method, {method: method}));
		}
	};
})(jQuery);
