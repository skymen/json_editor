import { ADD_BUTTON_ITEMS } from "../../shared/combos.js";

export const config = {
  id: "set-add-buttons",
  listName: "Set add buttons",
  displayText: "Set add buttons to [b]{0}[/b]",
  description: "Which kinds of new entry the add bars offer.",
  highlight: false,
  params: [
    {
      id: "mode",
      name: "Mode",
      desc: "Which add buttons to show.",
      type: "combo",
      initialValue: "value-array",
      items: ADD_BUTTON_ITEMS,
    },
  ],
};

export const expose = false;

export default function (mode) {
  this.setAddButtons(mode);
}
