export const config = {
  id: "set-allow-rename-keys",
  listName: "Set rename keys",
  displayText: "Set renaming keys [b]{0}[/b]",
  description: "Whether object key names can be edited in place.",
  highlight: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "Whether object key names can be edited in place.",
      type: "boolean",
      initialValue: "false",
    },
  ],
};

export const expose = false;

export default function (enabled) {
  this.setPermission("renameKeys", enabled);
}
