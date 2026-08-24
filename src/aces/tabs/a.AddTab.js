export const config = {
  id: "add-tab",
  listName: "Add tab",
  displayText: "Add tab [b]{0}[/b] labelled [i]{1}[/i] for [b]{3}[/b] ({2})",
  description:
    "Add a tab, or reconfigure one that already exists. The tab bar appears once there is more than one tab.",
  highlight: true,
  params: [
    {
      id: "tab",
      name: "Tab ID",
      desc: "A name for this tab, used by the other tab actions.",
      type: "string",
      initialValue: '"save"',
    },
    {
      id: "label",
      name: "Label",
      desc: "The text shown on the tab button.",
      type: "string",
      initialValue: '"Save"',
    },
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
      id: "object",
      name: "Object",
      desc: "The object this tab edits. Ignored for global variables.",
      type: "object",
      allowedPluginIds: ["Json", "Dictionary", "Arr"],
    },
  ],
};

export const expose = false;

export default function (tab, label, kind, object) {
  this.addTab(tab, label, kind, object);
}
