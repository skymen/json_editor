export const config = {
  id: "set-detect-c2array",
  listName: "Set detect c2array",
  displayText: "Set detecting c2arrays [b]{0}[/b]",
  description: "Whether an object holding c2array data is shown as a grid.",
  highlight: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "Whether an object holding c2array data is shown as a grid.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = false;

export default function (enabled) {
  this.setDetect("c2array", enabled);
}
