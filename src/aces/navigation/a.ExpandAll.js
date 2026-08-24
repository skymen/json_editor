export const config = {
  id: "expand-all",
  listName: "Expand all",
  displayText: "Expand all",
  description:
    "Open every branch of the current tab. Slow on a large document, since the whole tree is built at once.",
  highlight: false,
};

export const expose = false;

export default function () {
  this.expandAll();
}
