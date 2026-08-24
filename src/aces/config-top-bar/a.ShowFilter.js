export const config = {
  id: "show-filter",
  listName: "Show filter box",
  displayText: "Set the filter box [b]{0}[/b]",
  description: "Whether the key filter input is shown in the toolbar.",
  highlight: false,
  params: [
    {
      id: "enabled",
      name: "Visible",
      desc: "Whether the key filter input is shown in the toolbar.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = false;

export default function (enabled) {
  this.setChrome("filter", !!enabled);
}
