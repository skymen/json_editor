export const config = {
  id: "on-field-blurred",
  listName: "On field blurred",
  displayText: "On field blurred",
  description: "Triggered when a value field loses focus. LastPath holds its path.",
  highlight: false,
  isTrigger: true,
};

export const expose = true;

export default function () {
  return true;
}
