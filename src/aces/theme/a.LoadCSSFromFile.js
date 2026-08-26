import { CSS_MODE_ITEMS } from "../../shared/combos.js";

export const config = {
  id: "load-css-from-file",
  listName: "Load CSS file",
  displayText: "Load CSS file [b]{0}[/b] ({1})",
  description:
    "Load a .css file from the project's Files folder. Adding it on top means the file only has to override the --je-* variables it cares about; replacing means it becomes the theme. The layout layer is applied first either way and is never affected.",
  highlight: false,
  isAsync: true,
  params: [
    {
      id: "filename",
      name: "File",
      desc: "The name of a .css file in the project's Files folder.",
      type: "string",
      initialValue: '"editor-theme.css"',
      autocompleteId: "jsoneditor-css-file",
    },
    {
      id: "mode",
      name: "Mode",
      desc: "Whether the file adds to what is already there or replaces it.",
      type: "combo",
      initialValue: "append",
      items: CSS_MODE_ITEMS,
    },
  ],
};

export const expose = false;

export default async function (filename, mode) {
  await this.loadCssFile(filename, mode);
}
