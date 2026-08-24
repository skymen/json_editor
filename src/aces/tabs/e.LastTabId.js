export const config = {
  id: "last-tab-id",
  returnType: "string",
  description: "The ID of the tab the last edit or tab change happened on.",
};

export const expose = true;

export default function () {
  return this.lastTabId;
}
