export const config = {
  id: "set-tab-bar",
  listName: "Set tab bar",
  displayText: "Set tab bar to [b]{0}[/b]",
  description: "When the tab bar should be shown.",
  highlight: false,
  params: [
    {
      id: "mode",
      name: "Mode",
      desc: "When to show the tab bar.",
      type: "combo",
      initialValue: "auto",
      items: [
        { auto: "Auto (hide when single)" },
        { always: "Always" },
        { never: "Never" },
      ],
    },
  ],
};

export const expose = false;

export default function (mode) {
  this.setChrome("tabBar", mode);
}
