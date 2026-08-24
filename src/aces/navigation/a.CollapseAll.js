export const config = {
  id: "collapse-all",
  listName: "Collapse all",
  displayText: "Collapse all",
  description: "Clear the filter and close everything, down to the outer braces.",
  highlight: false,
};

export const expose = false;

export default function () {
  this.collapseAll();
}
