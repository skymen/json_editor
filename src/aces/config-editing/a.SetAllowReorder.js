export const config = {
  id: "set-allow-reorder",
  listName: "Set reorder elements",
  displayText: "Set reordering array elements [b]{0}[/b]",
  description: "Whether the move up and move down buttons are shown.",
  highlight: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "Whether the move up and move down buttons are shown.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = false;

export default function (enabled) {
  this.setPermission("reorder", enabled);
}
