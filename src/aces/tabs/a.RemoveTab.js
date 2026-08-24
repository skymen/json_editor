export const config = {
  id: "remove-tab",
  listName: "Remove tab",
  displayText: "Remove tab [b]{0}[/b]",
  description: "Remove a tab and everything the editor remembered about it.",
  highlight: false,
  params: [
    {
      id: "tab",
      name: "Tab ID",
      desc: "The tab to remove.",
      type: "string",
      initialValue: '""',
    },
  ],
};

export const expose = false;

export default function (tab) {
  this.removeTab(tab);
}
