export const config = {
  id: "last-path",
  returnType: "string",
  description: "The dot separated path of the last edit or focus change, such as player.inventory.2.name.",
};

export const expose = true;

export default function () {
  return this.lastPath;
}
