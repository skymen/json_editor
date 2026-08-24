export const config = {
  id: "show-close-button",
  listName: "Show close button",
  displayText: "Set the close button [b]{0}[/b]",
  description: "Whether a close button is shown in the tab bar.",
  highlight: false,
  params: [
    {
      id: "enabled",
      name: "Visible",
      desc: "Whether a close button is shown in the tab bar.",
      type: "boolean",
      initialValue: "false",
    },
  ],
};

export const expose = false;

export default function (enabled) {
  this.setChrome("close", !!enabled);
}
