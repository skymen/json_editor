export const config = {
  id: "clear-appended-css",
  listName: "Clear appended CSS",
  displayText: "Clear appended CSS",
  description: "Remove the rules added by Append CSS, leaving the theme alone.",
  highlight: false,
};

export const expose = false;

export default function () {
  this.clearAppendedCss();
}
