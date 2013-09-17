Hotkeys
=======

jQuery plugin to translate hotkeys into jQuery events.

This separates hotkeys from the actions to wich they are bound. This way one
just needs to register an event handler for a given action and not directly
for a hotkey. The assiciation between hotkey and action can later be changed
without the need of changing the event handler of the action.

Example:

```javascript
$(document).hotkeys("bind", "Shift-Enter", "show").
on("hotkey:action:show", "textarea", function (event) {
	alert(event.target.value);
});
```

It also supports Emacs like composed hotkeys:

```javascript
$(document).hotkeys("bind", "Ctrl-M D", "delete").
on("hotkey:action:delete", function (event) {
	$(this).remove();
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
won't work with Internet Explorer. Use `$(document)` if you want to bind
document global hotkeys.


.hotkeys(...)
-------------

### Events

#### hotkey

This event is triggered when a bound hotkey was pressed. It is triggered from
a `keydown` event handler which is registered on the element on which the hotkey
was bound. The event will be triggered on the target of that original event.

Properties:
 * `hotkey`: `[$.hotkeys.Hotkey]`
 * `action`: `String`
 * `originalEvent`: `$.Event`

#### hotkey:action:NAME

Same as the `hotkey` event, but adds the action `NAME` to the event type. This
way one can register an event handler that is only called for a specific action.

Properties:
 * `hotkey`: `[$.hotkeys.Hotkey]`
 * `action`: `String`
 * `originalEvent`: `$.Event`

#### hotkey:compose

This event is triggered when composition of a hotkey is started or continued.
It is only triggered for composed hotkeys.

Properties:
 * `hotkey`: `[$.hotkeys.Hotkey]`
 * `originalEvent`: `$.Event`

#### hotkey:abort-composition

This event is triggered when composition of a hotkey is aborted. This happens
when a key is pressed for which no composed hotkey can be found or when the
element on which the hotkeys are bound or the DOM window is clicked or loses
focus.

Properties:
 * `hotkey`: `[$.hotkeys.Hotkey]`
 * `originalEvent`: `$.Event`

### jQuery-set methods

#### .hotkeys('bind', hotkey, action) -> jQuery

Bind `hotkey` to `action`. See examples above.

#### .hotkeys(['bind'], hotkeys) -> jQuery

Bind multiple hotkeys to actions. See examples above.

#### .hotkeys('unbind', hotkey, action) -> jQuery

Removes binding between `hotkey` and `action`.

#### .hotkeys('bindings') -> {String: [String]}

Get all bindings registered on this element. The returned object maps actions
to arrays of hotkeys.

#### .hotkeys('bindings', action) -> [String]

Get all hotkeys bound to given `action`.

#### .hotkeys('action', hotkey) -> String or null

Get action bound to given `hotkey`. If no action is bound to this hotkey
`null` is returned.

#### .hotkeys('clear') -> jQuery

Clear hotkey bindings and remove all previously registered event handlers and
data objects.

#### .hotkeys('block', [what]) -> jQuery

Block hotkeys on all elements in the set. This is simply done by adding a
`keydown` event listener that stops event propagation in the situation specified
by `what`.

Values for `what`:
 * `non-modifier`: block hotkeys that don't use any modifier keys
 * `non-compose`: same as `non-modifier` except it allows non-modifier hotkeys
   if they occur as part of a composition hotkey (after the first position of
   the composition)
 * `all`: block all hotkeys (default)

#### .hotkeys('unblock', [what]) -> jQuery

Unblocks previously blocked hotkeys. See above for values of `what`.

### Helper functions

#### $.hotkeys.Hotkey()

`Hotkey` constructor. The `$.hotkeys.parse*` functions return `Hotkey` instances
(or arrays thereof).

Properties:
 * `keyCode`: `Number` or `null`
 * `altGraphKey`: `Boolean`
 * `altKey`: `Boolean`
 * `ctrlKey`: `Boolean`
 * `metaKey`: `Boolean`
 * `shiftKey`: `Boolean`

#### $.hotkeys.norm(hotkey) -> String

Normalize a single (non-composed) hotkey. `hotkey` is an instance of
`$.hotkeys.Hotkey`.

#### $.hotkeys.normComposed(hotkey) -> String

Normalize composed hotkey. `hotkey` is an array of `$.hotkeys.Hotkey` instances.

#### $.hotkeys.stringify(hotkey) -> String

Stringify a hotkey (composed or otherwise). `$.hotkeys.Hotkey` instances and
arrays of the same as returned by the methods described here overload the
`toString` method and thus this helper function isn't actually needed (unless
you have constructed the hotkey object manually).

#### $.hotkeys.parse(hotkey) -> $.hotkeys.Hotkey

Parses the string `hotkey` and returns a `$.hotkeys.Hotkey` instance.

#### $.hotkeys.parseComposed(hotkey) -> [$.hotkeys.Hotkey]

Parses the string `hotkey` and returns an array of `$.hotkeys.Hotkey` instances.

#### $.hotkeys.parseEvent(event) -> $.hotkeys.Hotkey

Analyzes the given `keydown`/`keyup` event and returns a `$.hotkeys.Hotkey` instance.

#### $.hotkeys.setLayout(layout)

Sets the current keyboard layout. See `$.hotkeys.defaultLayout` for the format
of `layout`.

#### $.hotkeys.getLayout(layout) -> Object

Gets the current keyboard layout. See `$.hotkeys.defaultLayout` for the format
of the returned object.

#### $.hotkeys.isValidActionName(name) -> Boolean

Check if `name` is a valid action name. An action name may not be empty and
may only contain english letters, numbers, `-` or `_`.

#### $.hotkeys.isValidKeyName(name) -> Boolean

Check if `name` is a valid key name. A key name may not be empty, may not contain
breakable spaces (`" "`, `"\t"`, `"\n"`, `"\r"`, `"\v"`), may only contain one `-`
at the start and may not be of the form `K+XXX` where `XXX` is a hexadecimal number.

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
   Maps key codes as provided in `keydown` events to key names. Key names are
   case insensitive. Key names including non-breakable spaces (`"\u00a0"`) are
   automatically aliased with a version that has the spaces stripped. Otherwise
   see `$.hotkeys.isValidKeyName` for a definition of valid key names.
 * `aliases`: `{String: Number}` (optional)  
   Maps key name aliases to key codes. Aliases shall be lower case. They are
   never used in key name normalization only in key name parsing (which is case
   insensitive).
 * `modifiers`: `{String: String}` (optional)  
   Maps modifier keys to key names.  
   Modifier key values:
    * `altGraphKey`
    * `altKey`
    * `ctrlKey`
    * `metaKey`
    * `shiftKey`
 * `modifierKeys`: `{Number: String}`  
   Maps key codes to modifier keys. See above for valid modifier key values.
 * `modifierAliases`: `{String: String}` (optional)  
   Maps modifier key name aliases to key codes. Aliases shall be lower case.

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

Use this jQuery plugin to display a hotkey configuration GUI.

### jQuery-set methods

#### .hotkeysConfig(options) -> jQuery

Display a hotkeys configuration GUI as a child element of this element.

`options`:
 * `context`: `String`, `Element` or `jQuery`  
   The element on which the hotkeys are defined.
 * `actions`: `{String: String or {"label": String, ["defaultHotkey": String]}}` (optional)  
   Action declarations.

#### .hotkeysConfig('actions') -> {String: {"label": String, [defaultHotkey: String]}}

Get all actions as the are known to the hotkeys configuration GUI. The returned
object maps action names to objects describing the actions.

#### .hotkeysConfig('actions', actions) -> jQuery

Add or update actions. This also dynamically updates the GUI. `actions` is an
object like the one returned by `.hotkeysConfig('actions')`.

#### .hotkeysConfig('action', name) -> {"label": String, [defaultHotkey: String]} or null

Get the configuration of the given action. Returns `null` if action name is
unknown.

`action` object properties:
 * `label`: `String`
 * `defaultHotkey`: `String` (otpional)

#### .hotkeysConfig('action', name, label) -> jQuery

Register or update an action. Same as the next function but only defining a
`label` (and no `defaultHotkey`).

#### .hotkeysConfig('action', name, action) -> jQuery

Register or update an action. Same as the next function but with `name` pulled
out as extra argument.

#### .hotkeysConfig('action', action) -> jQuery

Register or update an action. Update means if the action already exists and
has `label` or `defaultHotkey` set and the new action hasn't, then the old
`label`/`defaultHotkey` values are kept. Set them to `null` to explicitely
clear them.

`action` object properties:
 * `name`: `String`  
   An action name that. See `$.hotkeys.isValidActionName`.
 * `label`: `String` (optional, defaults to `name`)  
   This is what is actually displayed in the GUI.
 * `defaultHotkey`: `String` (optional)

#### .hotkeysConfig('removeAction', name) -> jQuery

Removes action with given `name` and updates GUI.

#### .hotkeysConfig('clear') -> jQuery

Removes the hotkey configuration GUI again.

### Global settings

#### $.hotkeysConfig.strings

Internationalization strings.

Properties:
 * `hdr_action`
 * `hdr_shortcuts`
 * `tooltip_add`
 * `tooltip_default`
 * `tooltip_change`
 * `tooltip_compose`
 * `tooltip_remove`
 * `btn_default`
 * `unsupported_key`
 * `confirm_reasign`
