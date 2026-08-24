import { THEME_ITEMS } from "../../shared/combos.js";

export const config = {
  id: "set-theme",
  listName: "Set theme",
  displayText: "Set theme to [b]{0}[/b]",
  description:
    "Switch to one of the built-in themes. Any CSS loaded on top of the previous theme is cleared.",
  highlight: true,
  params: [
    {
      id: "theme",
      name: "Theme",
      desc: "The built-in theme to apply.",
      type: "combo",
      initialValue: "construct-dark",
      items: THEME_ITEMS,
    },
  ],
};

export const expose = false;

export default function (theme) {
  this.setTheme(theme);
}
