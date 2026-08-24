<img src="./src/icon.svg" width="100" /><br>
# JSON Editor
<i>An in-game tree editor for JSON, Dictionary and Array objects, and for global variables.</i> <br>
### Version 1.0.0.0

[<img src="https://placehold.co/200x50/4493f8/FFF?text=Download&font=montserrat" width="200"/>](https://github.com/skymen/json_editor/releases/download/skymen_JSONEditor-1.0.0.0.c3addon/skymen_JSONEditor-1.0.0.0.c3addon)
<br>
<sub> [See all releases](https://github.com/skymen/json_editor/releases) </sub> <br>

#### What's New in 1.0.0.0
- **Added:** Initial release.

<sub>[View full changelog](#changelog)</sub>

---
<b><u>Author:</u></b> skymen <br>
<sub>Made using [CAW](https://marketplace.visualstudio.com/items?itemName=skymen.caw) </sub><br>

## Table of Contents
- [Usage](#usage)
- [Examples Files](#examples-files)
- [Properties](#properties)
- [Actions](#actions)
- [Conditions](#conditions)
- [Expressions](#expressions)
---
## Usage
To build the addon, run the following commands:

```
npm i
npm run build
```

To run the dev server, run

```
npm i
npm run dev
```

## Examples Files
| Description | Download |
| --- | --- |

---
## Properties
| Property Name | Description | Type |
| --- | --- | --- |
| Source | What the editor reads from and writes back to. | group |
| Source object | The JSON, Dictionary or Array object to edit; how to read it is worked out from its type. Leave empty to bind from events instead. | object |
| Edit global variables | Edit the project's global variables instead of an object. The source object is ignored when this is on. | check |
| Auto refresh | Re-read the source periodically so changes made by events show up in the editor. | check |
| Refresh interval (ms) | How often the source is re-read while Auto refresh is on. | integer |
| Editing | What the user is allowed to change. | group |
| Edit values | Allow editing scalar values. Turn off for a read-only viewer. | check |
| Add/remove object keys | Show an add bar and a remove button on the keys of plain objects. | check |
| Rename keys | Make object key names editable in place. | check |
| Add/remove array elements | Show the add bar and remove buttons on arrays. | check |
| Reorder array elements | Show the move up and move down buttons on arrays. | check |
| Resize c2arrays | Allow the width, height and depth of a c2array to be changed. | check |
| Add buttons | Which kinds of new entry the add bar offers. | combo |
| C2 formats | Special handling for the c2array and c2dictionary wrappers Construct writes. | group |
| Detect c2array | Show an object holding c2array/data/size as an editable grid. | check |
| Detect c2array in strings | Also parse string values that hold a serialised c2array, and write them back as strings. | check |
| Detect c2dictionary | Show an object holding c2dictionary/data as a flat list of keys. | check |
| Detect c2dictionary in strings | Also parse string values that hold a serialised c2dictionary, and write them back as strings. | check |
| Show c2array size | Show the width x height x depth inputs on a c2array. | check |
| Show c2array z plane bar | Show the z plane selector when a c2array is more than one plane deep. | check |
| Theme | How the editor is styled. Layout is fixed; a theme only describes colour. | group |
| Theme | Which built-in theme to start with. | combo |
| Custom CSS | A CSS file from the project's Files folder, loaded on startup. | projectfile |
| Custom CSS mode | Whether the custom CSS file adds to the built-in theme, so it only has to override what it wants, or replaces it outright. | combo |
| Top bar | Which controls the editor shows, and what closing it does. | group |
| UI scale | Multiplies the base font size the whole editor is laid out in. | float |
| Tab bar | When to show the tab bar. | combo |
| Show filter box | Show the key filter input in the toolbar. | check |
| Show collapse all | Show the Collapse all button in the toolbar. | check |
| Show close button | Show a close button in the tab bar. | check |
| Close behaviour | What the close button does after flushing pending edits. On close clicked fires either way. | combo |
| Advanced | Tuning that rarely needs changing. | group |
| Long value length | Values longer than this get a resizable multi-line field instead of a single line one. | integer |
| Commit debounce (ms) | How long typing pauses before an edit is written back to the source. | integer |
| Press freeze (ms) | Refreshes are held off for this long while a pointer is held down, so the tree cannot rebuild mid-drag. | integer |
| Block input | Stop clicks and key presses inside the editor from reaching the Mouse, Touch and Keyboard objects. | check |
| Override cursor | Force a normal mouse cursor inside the editor, even if the game hides it. | check |
| ID | An optional id for the host element, allowing it to be positioned with CSS. Only used when the element is created. | text |
| Class | An optional class for the host element. Only used when the element is created. | text |
| Style attribute | Initial content of the style attribute for the host element. Only used when the element is created. | text |


---
## Actions
| Action | Description | Params
| --- | --- | --- |
| Set add buttons | Which kinds of new entry the add bars offer. | Mode             *(combo)* <br> |
| Set add/remove array elements | Whether elements can be added to and removed from arrays. | Enabled             *(boolean)* <br> |
| Set add/remove object keys | Whether keys can be added to and removed from plain objects. | Enabled             *(boolean)* <br> |
| Set rename keys | Whether object key names can be edited in place. | Enabled             *(boolean)* <br> |
| Set reorder elements | Whether the move up and move down buttons are shown. | Enabled             *(boolean)* <br> |
| Set resize c2arrays | Whether the width, height and depth of a c2array can be changed. | Enabled             *(boolean)* <br> |
| Set detect c2array | Whether an object holding c2array data is shown as a grid. | Enabled             *(boolean)* <br> |
| Set detect c2array in strings | Whether string values holding a serialised c2array are parsed and edited as grids. | Enabled             *(boolean)* <br> |
| Set detect c2dictionary | Whether an object holding c2dictionary data is shown as a flat key list. | Enabled             *(boolean)* <br> |
| Set detect c2dictionary in strings | Whether string values holding a serialised c2dictionary are parsed and edited as key lists. | Enabled             *(boolean)* <br> |
| Set edit values | Whether scalar values can be edited. | Enabled             *(boolean)* <br> |
| Set show c2array size | Whether the width x height x depth inputs are shown on a c2array. | Enabled             *(boolean)* <br> |
| Set show c2array z plane bar | Whether the z plane selector is shown on a c2array deeper than one plane. | Enabled             *(boolean)* <br> |
| Set close behaviour | What the close button does after flushing pending edits. On close clicked fires either way. | Behaviour             *(combo)* <br> |
| Set tab bar | When the tab bar should be shown. | Mode             *(combo)* <br> |
| Set UI scale | Multiply the base font size the whole editor is laid out in. Everything is sized in em, so this scales the tree as a whole. | Scale             *(number)* <br> |
| Show close button | Whether a close button is shown in the tab bar. | Visible             *(boolean)* <br> |
| Show collapse all | Whether the Collapse all button is shown in the toolbar. | Visible             *(boolean)* <br> |
| Show filter box | Whether the key filter input is shown in the toolbar. | Visible             *(boolean)* <br> |
| Collapse all | Clear the filter and close everything, down to the outer braces. |  |
| Collapse path | Close one branch, leaving the rest of the tree alone. | Path             *(string)* <br> |
| Expand all | Open every branch of the current tab. Slow on a large document, since the whole tree is built at once. |  |
| Expand path | Open a branch and everything above it. | Path             *(string)* <br> |
| Scroll to path | Open a branch and scroll it into view. | Path             *(string)* <br> |
| Set filter text | Filter the tree to keys matching this text. An empty string clears the filter. | Text             *(string)* <br> |
| Refresh | Re-read every tab's source now. Only needed when auto refresh is off. |  |
| Set auto refresh | Turn periodic re-reading of the source on or off. | Enabled             *(boolean)* <br> |
| Set refresh interval | How often the source is re-read while auto refresh is on. | Interval             *(number)* <br> |
| Set source object | Point the editor at a JSON, Dictionary or Array object. The first instance is used unless one is picked. | Object             *(object)* <br>Tab             *(string)* <br> |
| Set source to global variables | Point a tab at the project's global variables instead of an object. | Tab             *(string)* <br> |
| Set source by UID | Point the editor at one specific instance, by its unique ID. | UID             *(number)* <br>Tab             *(string)* <br> |
| Add global variables tab | Add a tab showing the project's global variables. Keys cannot be added or removed, and each write is coerced back to the type the variable already holds. | Tab ID             *(string)* <br>Label             *(string)* <br> |
| Add tab | Add a tab bound to an object, or reconfigure one that already exists. How to read the object is worked out from its type. The tab bar appears once there is more than one tab. | Tab ID             *(string)* <br>Label             *(string)* <br>Object             *(object)* <br> |
| Clear tabs | Remove every tab, leaving the editor unbound. |  |
| Remove tab | Remove a tab and everything the editor remembered about it. | Tab ID             *(string)* <br> |
| Select tab | Switch to a tab, as clicking its button would. | Tab ID             *(string)* <br> |
| Load CSS file | Load a .css file from the project's Files folder. Adding it on top means the file only has to override the --je-* variables it cares about; replacing means it becomes the theme. The layout layer is applied first either way and is never affected. | File             *(string)* <br>Mode             *(combo)* <br> |
| Load CSS string | Apply CSS supplied directly, for a theme built or fetched by events. Adding it on top means it only has to override the --je-* variables it cares about; replacing means it becomes the theme. The layout layer is applied first either way and is never affected. | CSS             *(string)* <br>Mode             *(combo)* <br> |
| Set theme | Switch to one of the built-in themes. Any CSS loaded on top of the previous theme is cleared. | Theme             *(combo)* <br> |


---
## Conditions
| Condition | Description | Params
| --- | --- | --- |
| On any edit | Triggered after any edit at all, in addition to the specific trigger for it. |  |
| On close clicked | Triggered when the close button is clicked, after pending edits have been written. |  |
| On element added | Triggered after an element has been added to an array or a c2array. |  |
| On element removed | Triggered after an element has been removed from an array or a c2array. |  |
| On element reordered | Triggered after an array element has been moved. LastOldValue holds the index it came from. |  |
| On field blurred | Triggered when a value field loses focus. LastPath holds its path. |  |
| On field focused | Triggered when the user puts the caret in a value field. LastPath holds its path. |  |
| On key added | Triggered after a key has been added to an object or a dictionary. |  |
| On key removed | Triggered after a key has been removed from an object or a dictionary. |  |
| On key renamed | Triggered after a key has been renamed. LastOldValue holds the previous name. |  |
| On value changed | Triggered after a value edited in the editor has been written to the source. |  |
| On tab selected | Triggered when the user switches to a different tab. |  |


---
## Expressions
| Expression | Description | Return Type | Params
| --- | --- | --- | --- |
| LastKey | The key or index the last edit touched. | string |  | 
| LastOldValue | What was there before the last edit: the previous value, the previous key name, or the index an element came from. | any |  | 
| LastPath | The dot separated path of the last edit or focus change, such as player.inventory.2.name. | string |  | 
| LastValue | The value the last edit wrote. Empty for removals. | any |  | 
| FilterText | The filter text last set by an action. | string |  | 
| CurrentTab | The ID of the tab currently being shown. | string |  | 
| LastTabId | The ID of the tab the last edit or tab change happened on. | string |  | 
| Theme | The name of the current built-in theme, or "custom" when a stylesheet replaced it. | string |  | 


---
## Changelog

**1.0.0.0**
- **Added:** Initial release.
