export const config = {
  id: "set-edit-values",
  listName: "Set edit values",
  displayText: "Set editing values [b]{0}[/b]",
  description: "Whether scalar values can be edited.",
  highlight: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "Whether scalar values can be edited.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = false;

export default function (enabled) {
  this.setPermission("editValues", enabled);
}
