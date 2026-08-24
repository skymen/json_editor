export const config = {
  id: "append-css",
  listName: "Append CSS",
  displayText: "Append CSS [i]{0}[/i]",
  description:
    "Stack extra rules on top of the current theme, so a built-in theme can be tweaked rather than rewritten. Replaces anything appended before.",
  highlight: false,
  params: [
    {
      id: "css",
      name: "CSS",
      desc: "The rules to apply on top of the theme.",
      type: "string",
      initialValue: '""',
    },
  ],
};

export const expose = false;

export default function (css) {
  this.appendCss(css);
}
