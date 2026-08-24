export const config = {
  id: "expand-path",
  listName: "Expand path",
  displayText: "Expand [b]{0}[/b]",
  description: "Open a branch and everything above it.",
  highlight: false,
  params: [
    {
      id: "path",
      name: "Path",
      desc: 'A dot separated path, as the JSON plugin writes them, such as "player.inventory.2.name".',
      type: "string",
      initialValue: '""',
    },
  ],
};

export const expose = false;

export default function (path) {
  this.expandPath(path);
}
