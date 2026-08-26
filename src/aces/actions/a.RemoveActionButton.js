export const config = {
  id: "remove-action-button",
  listName: "Remove action button",
  displayText: "Remove action button [b]{0}[/b]",
  description: "Remove one action button. The bar disappears once it holds none.",
  highlight: false,
  params: [
    {
      id: "button",
      name: "Button ID",
      desc: "The button to remove.",
      type: "string",
      initialValue: '"save"',
      autocompleteId: "jsoneditor-action",
    },
  ],
};

export const expose = false;

export default function (button) {
  this.removeActionButton(button);
}
