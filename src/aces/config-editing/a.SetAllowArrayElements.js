export const config = {
  id: "set-allow-array-elements",
  listName: "Set add/remove array elements",
  displayText: "Set adding and removing array elements [b]{0}[/b]",
  description: "Whether elements can be added to and removed from arrays.",
  highlight: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "Whether elements can be added to and removed from arrays.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = false;

export default function (enabled) {
  this.setPermission("arrayElements", enabled);
}
