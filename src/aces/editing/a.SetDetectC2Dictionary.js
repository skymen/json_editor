export const config = {
  id: "set-detect-c2dictionary",
  listName: "Set detect c2dictionary",
  displayText: "Set detecting c2dictionaries [b]{0}[/b]",
  description: "Whether an object holding c2dictionary data is shown as a flat key list.",
  highlight: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "Whether an object holding c2dictionary data is shown as a flat key list.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = false;

export default function (enabled) {
  this.setDetect("c2dictionary", enabled);
}
