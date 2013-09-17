Hotkeys
=======

jQuery plugin to translate hotkeys into jQuery events.

Example:

```javascript
$(document).hotkeys("bind", "Shift-Enter", "show").
on("hotkey:action:show", "textarea", function (event) {
	alert(event.target.value);
});
```

It also supports EMACS like composed hotkeys:

```javascript
$(document).hotkeys("bind", "Ctrl-M D", "delete").
on("hotkey:action:delete", function (event) {
	...
});
```

Bind multiple hotkeys at once:

```javascript
$(document).hotkeys({
	"Alt-1": "action1",
	"Alt-2": "action2",
	...
});
```

You can run `.hotkeys(...)` on any jQuery set, but be aware that `$(window)`
won't work with Internet Explorer. Use `$(document)` if you want to register
document global hotkeys.


.hotkeys(...)
-------------

TODO

### jQuery-set methods

#### .hotkeys('bind', hotkey, action) -> jQuery

Bind `hotkey` to `action`.

#### .hotkeys(['bind'], hotkeys) -> jQuery
#### .hotkeys('unbind', hotkey, action) -> jQuery
#### .hotkeys('bindings') -> {String: [String]}
#### .hotkeys('bindings', action) -> [String]
#### .hotkeys('action', hotkey) -> String
#### .hotkeys('clear') -> jQuery
#### .hotkeys('block', [what]) -> jQuery

Values for `what`:
 * `non-modifier`
 * `non-compose`
 * `all` (default)

#### .hotkeys('unblock', [what]) -> jQuery

### Helper functions

#### $.hotkeys.Hotkey()

Hotkey constructor. The `$.hotkeys.parse*` functions return Hotkey instances
(or arrays therof).

Properties:
 * `keyCode`: `Number` or `null`
 * `altGraphKey`: `Boolean`
 * `altKey`: `Boolean`
 * `ctrlKey`: `Boolean`
 * `metaKey`: `Boolean`
 * `shiftKey`: `Boolean`

#### $.hotkeys.norm(hotkey) -> String
#### $.hotkeys.normSequence(hotkey) -> String
#### $.hotkeys.stringify(hotkey) -> String
#### $.hotkeys.parse(hotkey) -> $.hotkeys.Hotkey
#### $.hotkeys.parseSequence(hotkey) -> [$.hotkeys.Hotkey]
#### $.hotkeys.parseEvent(event) -> $.hotkeys.Hotkey
#### $.hotkeys.setLayout(layout)

Sets the current keyboard layout. See `$.hotkeys.defaultLayout` for the format
of `layout`.

#### $.hotkeys.getLayout(layout) -> Object

Gets the current keyboard layout. See `$.hotkeys.defaultLayout` for the format
of the returned object.

#### $.hotkeys.isValidAction(action) -> Boolean

Check if `action` is a valid action name. An anction name may not be empty and
only contain of english letters, numbers, `-` or `_`.

#### $.hotkeys.format(fmt, ...) -> String

Interpolate format strings.

Formats:
 * `{name}`: Insert property `name` from the object passed as second argument.
   `name` may not be empty and not contain `{` or `}`.
 * `{}`: Insert positional argument.
 * `{{`: Insert `{`.
 * `}}`: Insert `}`.

### Global settings

#### $.hotkeys.defaultLayout

Properties:
 * `keys`: `{Number: String}`
 * `aliases`: `{String: Number}` (optional)
 * `modifiers`: `{String: String}` (optional)
 * `modifierKeys`: `{Number: String}`
 * `modifierAliases`: `{String: String}` (optional)

#### $.hotkeys.strings

Internationalization strings.

Properties:
 * `unmatched_left`
 * `unmatched_right`
 * `hotkey_empty`
 * `key_name_spaces`
 * `key_name_k_xxx`
 * `key_name_unknown`
 * `hotkey_non_modifier`
 * `illegal_action_name`
 * `unknown_method`
 * `illegal_block_type`

.hotkeysConfig(...)
-------------------

### jQuery-set methods

#### .hotkeysConfig(config) -> jQuery
#### .hotkeysConfig('actions') -> {String: {"label": String, [defaultHotkey: String]}}
#### .hotkeysConfig('actions', actions) -> jQuery
#### .hotkeysConfig('action', name) -> jQuery
#### .hotkeysConfig('action', action) -> jQuery

Register or update action. Update means if the action already exists and
has `label` or `defaultHotkey` set and the the new action hasn't, then the
old `label`/`defaultHotkey` values are kept. Set them to `null` to explicitely
clear them.

`action` properties:
 * `name`
 * `label` (optional, defaults to `name`)
 * `defaultHotkey` (optional)

#### .hotkeysConfig('removeAction', name) -> jQuery
#### .hotkeysConfig('clear') -> jQuery

### Global settings

#### $.hotkeysConfig.strings

Internationalization strings.
