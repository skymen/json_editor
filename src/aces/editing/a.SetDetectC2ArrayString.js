export const config = {
  id: "set-detect-c2array-string",
  listName: "Set detect c2array in strings",
  displayText: "Set detecting c2arrays inside strings [b]{0}[/b]",
  description: "Whether string values holding a serialised c2array are parsed and edited as grids.",
  highlight: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "Whether string values holding a serialised c2array are parsed and edited as grids.",
      type: "boolean",
      initialValue: "false",
    },
  ],
};

export const expose = false;

export default function (enabled) {
  this.setDetect("c2arrayString", enabled);
}
