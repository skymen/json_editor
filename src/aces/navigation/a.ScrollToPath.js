export const config = {
  id: "scroll-to-path",
  listName: "Scroll to path",
  displayText: "Scroll to [b]{0}[/b]",
  description: "Open a branch and scroll it into view.",
  highlight: false,
  params: [
    {
      id: "path",
      name: "Path",
      desc: 'A dot separated path, as the JSON plugin writes them, such as "player.inventory.2.name".',
      type: "string",
      initialValue: '""',
      autocompleteId: "jsoneditor-path",
    },
  ],
};

export const expose = false;

export default function (path) {
  this.scrollToPath(path);
}
