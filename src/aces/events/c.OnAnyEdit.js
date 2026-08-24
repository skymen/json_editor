export const config = {
  id: "on-any-edit",
  listName: "On any edit",
  displayText: "On any edit",
  description: "Triggered after any edit at all, in addition to the specific trigger for it.",
  highlight: false,
  isTrigger: true,
};

export const expose = true;

export default function () {
  return true;
}
