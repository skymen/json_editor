# JSON Editor

A Construct 3 DOM plugin that shows a JSON, Dictionary or Array object — or the
project's global variables — as an editable tree inside the running game.

Drop it on a layout, point it at an object, and it stays in step with that
object both ways: edits made in the tree are written back, and changes made by
events show up in the tree.

## Getting started

1. Place a **JSON Editor** object on a layout and size it.
2. Set the **Source object** property to a JSON, Dictionary or Array object,
   or set **Source kind** to _Global variables_.
3. Run the project.

Everything else is optional. Actions can rebind the source, add tabs, change
what the user is allowed to edit, and swap the theme at runtime.

## What it edits

| Source kind | Read as | Notes |
| --- | --- | --- |
| JSON | the document itself | Values may be numbers, text, `true`, `false` or `null` |
| Dictionary | a `c2dictionary` wrapper | One flat level, numbers and text only |
| Array | a `c2array` wrapper | Shown as a grid with size inputs and a z plane bar |
| Global variables | one object of name → value | Keys are fixed; each write is coerced back to the variable's type |

Dictionary and Array sources rely on the matching **Detect c2dictionary** /
**Detect c2array** property being on, which it is by default.

### c2array and c2dictionary inside JSON

Save data written by Construct often nests these wrappers, either as an object
or — when it came from an `AsJSON` expression — as a *string* holding one. All
four cases are detected independently, so a project that wants a string left
alone can say so:

- Detect c2array / Detect c2array in strings
- Detect c2dictionary / Detect c2dictionary in strings

A wrapper stored as a string is parsed for editing and re-serialised back into
the same string on commit, including when wrappers are nested inside each
other.

## Editing permissions

Each capability is a property and a Set action:

| Capability | Default |
| --- | --- |
| Edit values | on |
| Add/remove array elements | on |
| Reorder array elements | on |
| Resize c2arrays | on |
| Add/remove object keys | **off** |
| Rename keys | **off** |

Turning **Edit values** off makes the editor a read-only viewer. The **Add
buttons** property controls whether the add bars offer just a value, a value
and an array, or a value, an object and an array.

## Paths

Triggers report paths and navigation actions accept them in the same dot
separated form the built-in JSON plugin uses:

```
player.inventory.2.name
save.data.gold          ← a key inside a c2dictionary
grid.data.0.1.0         ← cell x=0, y=1, z=0 of a c2array
```

`LastPath`, `LastKey`, `LastValue` and `LastOldValue` describe the last edit.
`LastOldValue` holds the previous value, or for a rename the previous key name,
or for a reorder the index the element came from.

## Theming

Styling is two layers, and a theme never has to restate layout:

- **layout.css** — structure only: display, flex, grid, sizing, overflow and
  the resets. Always applied, never replaced.
- **theme** — colour, border, radius and weight, all driven by a documented
  `--je-*` variable set. Swappable.

Three themes ship built in: `construct-dark`, `construct-light` and `bare`
(layout only, the starting point for writing your own).

To customise, name a `.css` file from the project's Files folder in the
**Custom CSS** property. **Custom CSS mode** decides whether it stacks on top
of the built-in theme — so the file only has to override the variables it cares
about — or replaces the theme layer outright. `examples/editor-theme.css` is a
worked example, and lists the class names.

At runtime: **Set theme**, **Load CSS from file**, **Set theme CSS** (a string)
and **Append CSS**.

The editor lives in a shadow root, so a project's own CSS cannot reach inside
and break the tree's layout — and equally, the theme actions above are the way
to style it. Inherited properties still cross the boundary, so the layout layer
resets `cursor`, `color`, `font`, `line-height` and `direction` explicitly.

## How it works

The UI runs on the DOM side, which in worker mode is a different thread from
the runtime, so everything crosses a message boundary.

```
runtime instance ──(poll + snapshot diff)──> DOM side: the document, per tab
                 <──(semantic ops: path + op + value)── DOM side
```

- **Reading** is a poll. Every tab's source is re-read on an interval
  (`Refresh interval`, default 200 ms), serialised, and compared with what was
  last sent; only a tab that actually changed is posted. An idle editor costs
  one read and one `JSON.stringify` per interval and sends nothing.
- **Writing** goes back as ops, not documents. Each op re-reads the source,
  applies itself to that fresh document and writes the result back, so an edit
  can never clobber a change the game made while a field was focused.

The coarse part is that a changed tab sends its whole document. That is
deliberate for v1 and confined to `src/runtime/sync.js` and `Editor.setData`;
replacing it with a diff means changing those two and nothing else.

## Source layout

```
src/
  shared/     pure logic, imported by both sides
  runtime/    properties, ACEs, source adapters, the poll loop
  domside/    the shadow root, the render tree, the views
  editor/     the placeholder drawn in Construct's layout view
  css/        layout.css and the built-in themes
  aces/       one file per action, condition and expression
```

`src/runtime/sources/` holds one adapter per kind, each of them whole-document
in and whole-document out. Adding a new kind of source means adding one file
there and one entry in `sources/index.js`.

## Building

```bash
npm install
npm run dev     # dev server, add the URL it prints as a dev addon in Construct
npm run build   # produces skymen_JSONEditor-<version>.c3addon in dist/
```
