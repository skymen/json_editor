export const config = {
  id: "on-value-changed",
  listName: "On value changed",
  displayText: "On value changed",
  description: "Triggered after a value edited in the editor has been written to the source.",
  highlight: false,
  isTrigger: true,
};

export const expose = true;

export default function () {
  return true;
}
