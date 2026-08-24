export const config = {
  id: "last-key",
  returnType: "string",
  description: "The key or index the last edit touched.",
};

export const expose = true;

export default function () {
  return this.lastKey;
}
