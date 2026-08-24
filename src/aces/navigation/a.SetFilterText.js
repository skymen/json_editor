export const config = {
  id: "set-filter-text",
  listName: "Set filter text",
  displayText: "Set filter to [i]{0}[/i]",
  description:
    "Filter the tree to keys matching this text. An empty string clears the filter.",
  highlight: false,
  params: [
    {
      id: "text",
      name: "Text",
      desc: "The text to match key names against.",
      type: "string",
      initialValue: '""',
    },
  ],
};

export const expose = false;

export default function (text) {
  this.setFilterText(text);
}
