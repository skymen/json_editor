export const config = {
  id: "set-source-kind",
  listName: "Set source kind",
  displayText: "Set source kind of tab [i]{1}[/i] to [b]{0}[/b]",
  description:
    "Choose how the bound object is read, or bind the tab to the project's global variables.",
  highlight: false,
  params: [
    {
      id: "kind",
      name: "Kind",
      desc: "How to read the source.",
      type: "combo",
      initialValue: "auto",
      items: [
        { auto: "Auto-detect" },
        { json: "JSON" },
        { dictionary: "Dictionary" },
        { array: "Array" },
        { globals: "Global variables" },
        { none: "None" },
      ],
    },
    {
      id: "tab",
      name: "Tab",
      desc: "Which tab to change. Leave empty for the current tab.",
      type: "string",
      initialValue: '""',
    },
  ],
};

export const expose = false;

export default function (kind, tab) {
  this.setSourceKind(kind, tab || this.currentTab);
}
