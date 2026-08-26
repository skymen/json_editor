export const config = {
  id: "clear-action-buttons",
  listName: "Clear action buttons",
  displayText: "Clear action buttons",
  description: "Remove every action button, from both bars.",
  highlight: false,
};

export const expose = false;

export default function () {
  this.clearActionButtons();
}
