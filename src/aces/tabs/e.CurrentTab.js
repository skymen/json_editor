export const config = {
  id: "current-tab",
  returnType: "string",
  description: "The ID of the tab currently being shown.",
};

export const expose = true;

export default function () {
  return this.currentTab;
}
