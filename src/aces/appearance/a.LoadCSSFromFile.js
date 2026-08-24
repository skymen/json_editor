export const config = {
  id: "load-css-from-file",
  listName: "Load CSS from file",
  displayText: "Load CSS from file [b]{0}[/b] ({1})",
  description:
    "Load a .css file from the project's Files folder, either on top of the current theme or in place of it.",
  highlight: false,
  isAsync: true,
  params: [
    {
      id: "filename",
      name: "File",
      desc: "The name of a .css file in the project's Files folder.",
      type: "string",
      initialValue: '"editor-theme.css"',
    },
    {
      id: "mode",
      name: "Mode",
      desc: "Whether the file adds to the current theme or replaces it.",
      type: "combo",
      initialValue: "append",
      items: [
        { append: "Add on top of the theme" },
        { replace: "Replace the theme" },
      ],
    },
  ],
};

export const expose = false;

export default async function (filename, mode) {
  await this.loadCssFile(filename, mode);
}
