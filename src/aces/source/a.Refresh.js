export const config = {
  id: "refresh",
  listName: "Refresh",
  displayText: "Refresh",
  description:
    "Re-read every tab's source now. Only needed when auto refresh is off.",
  highlight: false,
};

export const expose = false;

export default function () {
  this.refresh();
}
