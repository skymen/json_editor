export const config = {
  id: "select-tab",
  listName: "Select tab",
  displayText: "Select tab [b]{0}[/b]",
  description: "Switch to a tab, as clicking its button would.",
  highlight: false,
  params: [
    {
      id: "tab",
      name: "Tab ID",
      desc: "The tab to show.",
      type: "string",
      initialValue: '""',
      autocompleteId: "jsoneditor-tab",
    },
  ],
};

export const expose = false;

export default function (tab) {
  this.selectTab(tab);
}
