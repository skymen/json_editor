export const config = {
  id: "set-source-to-globals",
  listName: "Set source to global variables",
  displayText: "Set source of tab [i]{0}[/i] to global variables",
  description:
    "Point a tab at the project's global variables instead of an object.",
  highlight: false,
  params: [
    {
      id: "tab",
      name: "Tab",
      desc: "Which tab to change. Leave empty for the current tab.",
      type: "string",
      initialValue: '""',
      autocompleteId: "jsoneditor-tab",
    },
  ],
};

export const expose = false;

export default function (tab) {
  this.setSourceToGlobals(tab);
}
