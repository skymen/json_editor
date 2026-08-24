export const config = {
  id: "set-detect-c2dictionary-string",
  listName: "Set detect c2dictionary in strings",
  displayText: "Set detecting c2dictionaries inside strings [b]{0}[/b]",
  description: "Whether string values holding a serialised c2dictionary are parsed and edited as key lists.",
  highlight: false,
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "Whether string values holding a serialised c2dictionary are parsed and edited as key lists.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = false;

export default function (enabled) {
  this.setDetect("c2dictionaryString", enabled);
}
