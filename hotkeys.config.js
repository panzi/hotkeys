(function ($, undefined) {
	$.hotkeysConfig = {		
		format: format,
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
			confirm_reasign: 'The hotkey {hotkey} is already assigned to the action "{action}".\nDo you want to reasign this hotkey?',
			unmatched_left:  'Unmatched left curly bracket "{" in format.',
			unmatched_right: 'Unmatched right curly bracket "}" in format.'
		}
	};

	function getContext (elem) {
		return $(elem.parents('.hotkey-config').data('hotkeys-context'));
	}

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
				case '{': throw new SyntaxError($.hotkeysConfig.strings.unmatched_left);
				case '}': throw new SyntaxError($.hotkeysConfig.strings.unmatched_right);
			}
		});
	}

	function renderHotkey (hotkey) {
		var li = $('<li>',{'data-hotkey':hotkey});
		var strs = $.hotkeysConfig.strings;

		if (hotkey) {
			var seq = $.hotkeys.parseSequence(hotkey);
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
		var ctx     = getContext(actionEl);
		var action  = ctx.hotkeys('actions')[actionName];
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
			var ctx = getContext(hotkeyEl);
			var other = ctx.hotkeys('action',hotkey_seq);

			// TODO: check for ambigious prefix?
			if (other === actionName) {
				if (hotkey_seq !== oldhotkey) {
					hotkeyEl.remove();
				}
			}
			else if (other) {
				var otherAction = ctx.hotkeys('actions')[other];
				if (confirm(format(strs.confirm_reasign, {
					hotkey: hotkey_seq,
					action: otherAction ? otherAction.label : other
				}))) {
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

	function renderConfig (ctx) {
		var table = $('<table>',{'class':'hotkey-config'});
		var thead = $('<thead>').appendTo(table);
		var tbody = $('<tbody>').appendTo(table);

		table.data('hotkeys-context',ctx);
		ctx = $(ctx);

		var bindings = ctx.hotkeys('bindings');
		var actions  = ctx.hotkeys('actions');
		var heading = $('<tr>').appendTo(thead);
		var strs = $.hotkeysConfig.strings;

		$('<th>').text(strs.hdr_action).appendTo(thead);
		$('<th>').text(strs.hdr_shortcuts).appendTo(thead);
		$('<th>').appendTo(thead);
		$('<th>').appendTo(thead);

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

				$('<td>').append($('<button>',{'class':'add',title:strs.tooltip_add}).
					text('+').click(addHotkey)).appendTo(tr);

				$('<td>').append($('<button>',{'class':'default',title:strs.tooltip_default}).
					text(strs.btn_default).click(resetHotkeys)).appendTo(tr);

				tbody.append(tr);
			}
		}

		return table;
	}

	$.fn.hotkeysConfig = function (ctx) {
		return this.empty().append(renderConfig(ctx));
	};
})(jQuery);
