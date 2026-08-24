export const config = {
  id: "clear-tabs",
  listName: "Clear tabs",
  displayText: "Clear tabs",
  description: "Remove every tab, leaving the editor unbound.",
  highlight: false,
};

export const expose = false;

export default function () {
  this.clearTabs();
}
