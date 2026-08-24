export const config = {
  id: "set-theme-css",
  listName: "Set theme CSS",
  displayText: "Set theme CSS to [i]{0}[/i]",
  description:
    "Replace the theme layer with CSS supplied directly. Layout rules are applied first and are not affected.",
  highlight: false,
  params: [
    {
      id: "css",
      name: "CSS",
      desc: "The stylesheet to use as the theme layer.",
      type: "string",
      initialValue: '""',
    },
  ],
};

export const expose = false;

export default function (css) {
  this.setThemeCss(css);
}
