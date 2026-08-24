export const config = {
  id: "filter-text",
  returnType: "string",
  description: "The filter text last set by an action.",
};

export const expose = true;

export default function () {
  return this.filterText;
}
