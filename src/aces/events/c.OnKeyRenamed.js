export const config = {
  id: "on-key-renamed",
  listName: "On key renamed",
  displayText: "On key renamed",
  description: "Triggered after a key has been renamed. LastOldValue holds the previous name.",
  highlight: false,
  isTrigger: true,
};

export const expose = true;

export default function () {
  return true;
}
