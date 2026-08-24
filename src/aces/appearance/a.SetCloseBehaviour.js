export const config = {
  id: "set-close-behaviour",
  listName: "Set close behaviour",
  displayText: "Set close behaviour to [b]{0}[/b]",
  description:
    "What the close button does after flushing pending edits. On close clicked fires either way.",
  highlight: false,
  params: [
    {
      id: "mode",
      name: "Behaviour",
      desc: "What happens when the close button is clicked.",
      type: "combo",
      initialValue: "trigger",
      items: [
        { trigger: "Trigger only" },
        { hide: "Hide" },
        { destroy: "Destroy" },
      ],
    },
  ],
};

export const expose = false;

export default function (mode) {
  this.setCloseBehaviour(mode);
}
