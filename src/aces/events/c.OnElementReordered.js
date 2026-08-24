export const config = {
  id: "on-element-reordered",
  listName: "On element reordered",
  displayText: "On element reordered",
  description: "Triggered after an array element has been moved. LastOldValue holds the index it came from.",
  highlight: false,
  isTrigger: true,
};

export const expose = true;

export default function () {
  return true;
}
