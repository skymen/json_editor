export const config = {
  id: "collapse-path",
  listName: "Collapse path",
  displayText: "Collapse [b]{0}[/b]",
  description: "Close one branch, leaving the rest of the tree alone.",
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
  this.collapsePath(path);
}
