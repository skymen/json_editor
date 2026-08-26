export const config = {
  id: "on-any-action-button-clicked",
  listName: "On any action button clicked",
  displayText: "On any action button clicked",
  description:
    "Triggered when any action button is pressed. Use Action button ID to tell which.",
  highlight: false,
  isTrigger: true,
};

export const expose = true;

export default function () {
  return true;
}
