import { ACTION_KIND_ITEMS } from "../../shared/actionButtons.js";

export const config = {
  id: "add-action-button",
  listName: "Add action button",
  displayText:
    "Add action button [b]{0}[/b] labelled [i]{1}[/i] doing [b]{2}[/b] on tab [i]{3}[/i]",
  description:
    "Add a button to the action bar, or reconfigure one that already exists. A custom button only fires On action button clicked and leaves the rest to you; the built-in kinds work on whichever tab is open, and Save to file writes under the tab's label. Leave the tab empty to show the button on every tab, or name one to move it to its own bar underneath.",
  highlight: true,
  params: [
    {
      id: "button",
      name: "Button ID",
      desc: "A name for this button, used by the trigger and by Remove action button.",
      type: "string",
      initialValue: '"save"',
      autocompleteId: "jsoneditor-action",
    },
    {
      id: "label",
      name: "Label",
      desc: "The text shown on the button. Leave empty to use the default for the kind.",
      type: "string",
      initialValue: '""',
    },
    {
      id: "kind",
      name: "Kind",
      desc: "What pressing the button does.",
      type: "combo",
      initialValue: "custom",
      items: ACTION_KIND_ITEMS,
    },
    {
      id: "tab",
      name: "Tab",
      desc: "The tab this button belongs to. Leave empty to show it on every tab.",
      type: "string",
      initialValue: '""',
      autocompleteId: "jsoneditor-tab",
    },
  ],
};

export const expose = false;

export default function (button, label, kind, tab) {
  this.addActionButton(button, label, kind, tab);
}
