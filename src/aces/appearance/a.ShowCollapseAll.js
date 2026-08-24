export const config = {
  id: "show-collapse-all",
  listName: "Show collapse all",
  displayText: "Set the Collapse all button [b]{0}[/b]",
  description: "Whether the Collapse all button is shown in the toolbar.",
  highlight: false,
  params: [
    {
      id: "enabled",
      name: "Visible",
      desc: "Whether the Collapse all button is shown in the toolbar.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = false;

export default function (enabled) {
  this.setChrome("collapseAll", !!enabled);
}
