export const config = {
  id: "set-ui-scale",
  listName: "Set UI scale",
  displayText: "Set UI scale to [b]{0}[/b]",
  description:
    "Multiply the base font size the whole editor is laid out in. Everything is sized in em, so this scales the tree as a whole.",
  highlight: false,
  params: [
    {
      id: "scale",
      name: "Scale",
      desc: "The scale factor. 1 is the page's own font size.",
      type: "number",
      initialValue: "0.6",
    },
  ],
};

export const expose = false;

export default function (scale) {
  this.setUiScale(scale);
}
