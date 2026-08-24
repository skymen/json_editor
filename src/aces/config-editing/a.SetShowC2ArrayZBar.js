export const config = {
  id: "set-show-c2array-zbar",
  listName: "Set show c2array z plane bar",
  displayText: "Set showing the c2array z plane bar [b]{0}[/b]",
  description: "Whether the z plane selector is shown on a c2array deeper than one plane.",
  highlight: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "Whether the z plane selector is shown on a c2array deeper than one plane.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = false;

export default function (enabled) {
  this.setDetect("c2ArrayZBar", enabled);
}
