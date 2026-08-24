export const config = {
  id: "set-refresh-interval",
  listName: "Set refresh interval",
  displayText: "Set refresh interval to [b]{0}[/b] ms",
  description: "How often the source is re-read while auto refresh is on.",
  highlight: false,
  params: [
    {
      id: "interval",
      name: "Interval",
      desc: "Milliseconds between reads.",
      type: "number",
      initialValue: "200",
    },
  ],
};

export const expose = false;

export default function (interval) {
  this.setRefreshInterval(interval);
}
