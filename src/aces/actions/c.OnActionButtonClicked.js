export const config = {
  id: "on-action-button-clicked",
  listName: "On action button clicked",
  displayText: "On action button [b]{0}[/b] clicked",
  description:
    "Triggered when that action button is pressed. Built-in buttons fire it too, after they have done their work.",
  highlight: true,
  isTrigger: true,
  params: [
    {
      id: "button",
      name: "Button ID",
      desc: "The button to listen for.",
      type: "string",
      initialValue: '"save"',
      autocompleteId: "jsoneditor-action",
    },
  ],
};

export const expose = true;

export default function (button) {
  return button === this.lastActionId;
}
