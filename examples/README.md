# Examples

## json-editor-showcase.c3p

A five page tour of the plugin. Open it in Construct, hit preview, and walk
through with the buttons at the bottom of each page.

| Page | Shows |
| --- | --- |
| 1 Live binding | Two-way sync with a JSON object. Edit the tree and the readout follows; press a button and the tree follows. Includes a c2dictionary stored as a string and a c2array grid. |
| 2 Tabs and sources | One editor, four sources: JSON, Dictionary, Array and global variables. The Dictionary and Array start empty, so you can fill them from the editor itself. |
| 3 Themes | The three built-in themes, `showcase-theme.css` loaded both ways (added on top of the Construct rules, and replacing them), and `showcase-theme-full.css`, a complete replacement look. |
| 4 Editing rules | The six permission flags, as three presets. Controls for anything switched off are not built at all, so nothing is greyed out. |
| 5 Events and paths | Edit triggers writing to a log with `LastPath` / `LastValue` / `LastOldValue`, and the filter, expand and scroll-to-path actions. |

The project has no images or sounds and depends only on stock plugins, so it
opens quickly and is easy to read.

## editor-theme.css

The shallow end: a block of `--je-*` overrides and nothing else. Loaded in
*add on top* mode it keeps every Construct rule — the borderless fields, the
pressed-state inversion, the tab fade — and only changes the colours. Ten
variables is the whole file.

Copy it into a project's Files folder and name it in the editor's **Custom
CSS** property, or load it at runtime with **Load CSS file**.

## editor-theme-full.css

The deep end: a complete replacement look, "Blueprint". Loaded in *replace*
mode it drops the Construct theme entirely and describes everything itself —
square corners, fields as underlines rather than filled boxes, tabs as plain
text with a rule under the active one, banded rows, monospaced chrome.

It is worth reading next to `editor-theme.css` to see where the line falls.
`layout.css` still runs underneath in both cases and owns where things are: the
flex rows, the tree indent, the c2array grid, the field widths, the resets.
Neither file says `display`, `flex`, `grid`, `width` or `height` — that is why
a theme can be ten lines when it wants to be, and why a full one still only has
to talk about appearance.
