export const config = {
  id: "last-old-value",
  returnType: "any",
  description: "What was there before the last edit: the previous value, the previous key name, or the index an element came from.",
};

export const expose = true;

export default function () {
  return this.lastOldValue;
}
