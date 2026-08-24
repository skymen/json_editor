export const config = {
  id: "set-auto-refresh",
  listName: "Set auto refresh",
  displayText: "Set auto refresh [b]{0}[/b]",
  description: "Turn periodic re-reading of the source on or off.",
  highlight: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "Whether to re-read the source periodically.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = false;

export default function (enabled) {
  this.setAutoRefresh(enabled);
}
