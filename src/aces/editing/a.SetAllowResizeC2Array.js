export const config = {
  id: "set-allow-resize-c2array",
  listName: "Set resize c2arrays",
  displayText: "Set resizing c2arrays [b]{0}[/b]",
  description: "Whether the width, height and depth of a c2array can be changed.",
  highlight: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "Whether the width, height and depth of a c2array can be changed.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = false;

export default function (enabled) {
  this.setPermission("resizeC2Array", enabled);
}
