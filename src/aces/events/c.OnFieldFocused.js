export const config = {
  id: "on-field-focused",
  listName: "On field focused",
  displayText: "On field focused",
  description: "Triggered when the user puts the caret in a value field. LastPath holds its path.",
  highlight: false,
  isTrigger: true,
};

export const expose = true;

export default function () {
  return true;
}
