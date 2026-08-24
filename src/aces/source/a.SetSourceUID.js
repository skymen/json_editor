export const config = {
  id: "set-source-uid",
  listName: "Set source by UID",
  displayText: "Set source of tab [i]{1}[/i] to UID [b]{0}[/b]",
  description:
    "Point the editor at one specific instance, by its unique ID.",
  highlight: false,
  params: [
    {
      id: "uid",
      name: "UID",
      desc: "The unique ID of the instance to edit.",
      type: "number",
      initialValue: "0",
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

export default function (uid, tab) {
  this.setSourceUID(uid, tab || this.currentTab);
}
