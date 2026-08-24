# Examples

## json-editor-showcase.c3p

A five page tour of the plugin. Open it in Construct, hit preview, and walk
through with the buttons at the bottom of each page.

| Page | Shows |
| --- | --- |
| 1 Live binding | Two-way sync with a JSON object. Edit the tree and the readout follows; press a button and the tree follows. Includes a c2dictionary stored as a string and a c2array grid. |
| 2 Tabs and sources | One editor, four sources: JSON, Dictionary, Array and global variables. The Dictionary and Array start empty, so you can fill them from the editor itself. |
| 3 Themes | The three built-in themes, plus `showcase-theme.css` loaded both ways — added on top of the Construct rules, and replacing them. |
| 4 Editing rules | The six permission flags, as three presets. Controls for anything switched off are not built at all, so nothing is greyed out. |
| 5 Events and paths | Edit triggers writing to a log with `LastPath` / `LastValue` / `LastOldValue`, and the filter, expand and scroll-to-path actions. |

The project has no images or sounds and depends only on stock plugins, so it
opens quickly and is easy to read.

## editor-theme.css

A worked example of a custom theme: a block of `--je-*` overrides that keeps
the built-in Construct rules and only recolours. Copy it into a project's Files
folder and name it in the editor's **Custom CSS** property, or load it at
runtime with **Load CSS file**.
