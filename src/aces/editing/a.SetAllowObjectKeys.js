export const config = {
  id: "set-allow-object-keys",
  listName: "Set add/remove object keys",
  displayText: "Set adding and removing object keys [b]{0}[/b]",
  description: "Whether keys can be added to and removed from plain objects.",
  highlight: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "Whether keys can be added to and removed from plain objects.",
      type: "boolean",
      initialValue: "false",
    },
  ],
};

export const expose = false;

export default function (enabled) {
  this.setPermission("objectKeys", enabled);
}
