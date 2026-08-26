export const config = {
  id: "add-globals-tab",
  listName: "Add global variables tab",
  displayText: "Add tab [b]{0}[/b] labelled [i]{1}[/i] for global variables",
  description:
    "Add a tab showing the project's global variables. Keys cannot be added or removed, and each write is coerced back to the type the variable already holds.",
  highlight: false,
  params: [
    {
      id: "tab",
      name: "Tab ID",
      desc: "A name for this tab, used by the other tab actions.",
      type: "string",
      initialValue: '"globals"',
      autocompleteId: "jsoneditor-tab",
    },
    {
      id: "label",
      name: "Label",
      desc: "The text shown on the tab button.",
      type: "string",
      initialValue: '"Globals"',
    },
  ],
};

export const expose = false;

export default function (tab, label) {
  this.addGlobalsTab(tab, label);
}
