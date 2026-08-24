export const config = {
  id: "add-tab",
  listName: "Add tab",
  displayText: "Add tab [b]{0}[/b] labelled [i]{1}[/i] for [b]{2}[/b]",
  description:
    "Add a tab bound to an object, or reconfigure one that already exists. How to read the object is worked out from its type. The tab bar appears once there is more than one tab.",
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
      id: "object",
      name: "Object",
      desc: "The JSON, Dictionary or Array object this tab edits.",
      type: "object",
      allowedPluginIds: ["JSON", "Dictionary", "Arr"],
    },
  ],
};

export const expose = false;

export default function (tab, label, object) {
  this.addTab(tab, label, object);
}
