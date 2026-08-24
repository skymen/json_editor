export const config = {
  id: "set-theme",
  listName: "Set theme",
  displayText: "Set theme to [b]{0}[/b]",
  description: "Switch to one of the built-in themes.",
  highlight: true,
  params: [
    {
      id: "theme",
      name: "Theme",
      desc: "The built-in theme to apply.",
      type: "combo",
      initialValue: "construct-dark",
      items: [
        { "construct-dark": "Construct dark" },
        { "construct-light": "Construct light" },
        { bare: "Bare (layout only)" },
      ],
    },
  ],
};

export const expose = false;

export default function (theme) {
  this.setTheme(theme);
}
