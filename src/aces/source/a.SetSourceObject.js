export const config = {
  id: "set-source-object",
  listName: "Set source object",
  displayText: "Set source of tab [i]{1}[/i] to [b]{0}[/b]",
  description:
    "Point the editor at a JSON, Dictionary or Array object. The first instance is used unless one is picked.",
  highlight: true,
  params: [
    {
      id: "object",
      name: "Object",
      desc: "The object to edit.",
      type: "object",
      allowedPluginIds: ["Json", "Dictionary", "Arr"],
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

export default function (object, tab) {
  this.setSourceObject(object, tab || this.currentTab);
}
