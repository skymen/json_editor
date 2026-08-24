export const config = {
  id: "last-value",
  returnType: "any",
  description: "The value the last edit wrote. Empty for removals.",
};

export const expose = true;

export default function () {
  return this.lastValue;
}
