import { CSS_MODE_ITEMS } from "../../shared/combos.js";

export const config = {
  id: "load-css-string",
  listName: "Load CSS string",
  displayText: "Load CSS [i]{0}[/i] ({1})",
  description:
    "Apply CSS supplied directly, for a theme built or fetched by events. Adding it on top means it only has to override the --je-* variables it cares about; replacing means it becomes the theme. The layout layer is applied first either way and is never affected.",
  highlight: false,
  params: [
    {
      id: "css",
      name: "CSS",
      desc: "The stylesheet to apply.",
      type: "string",
      initialValue: '""',
    },
    {
      id: "mode",
      name: "Mode",
      desc: "Whether the CSS adds to what is already there or replaces it.",
      type: "combo",
      initialValue: "append",
      items: CSS_MODE_ITEMS,
    },
  ],
};

export const expose = false;

export default function (css, mode) {
  this.applyCss(css, mode);
}
