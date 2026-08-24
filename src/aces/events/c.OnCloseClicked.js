export const config = {
  id: "on-close-clicked",
  listName: "On close clicked",
  displayText: "On close clicked",
  description: "Triggered when the close button is clicked, after pending edits have been written.",
  highlight: false,
  isTrigger: true,
};

export const expose = true;

export default function () {
  return true;
}
