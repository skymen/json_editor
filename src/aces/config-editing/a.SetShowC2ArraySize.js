export const config = {
  id: "set-show-c2array-size",
  listName: "Set show c2array size",
  displayText: "Set showing the c2array size inputs [b]{0}[/b]",
  description: "Whether the width x height x depth inputs are shown on a c2array.",
  highlight: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "Whether the width x height x depth inputs are shown on a c2array.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = false;

export default function (enabled) {
  this.setDetect("c2ArrayDims", enabled);
}
