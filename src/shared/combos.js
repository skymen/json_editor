// Every combo in the addon, defined once.
//
// Construct hands combo values over as a zero-based *index*, both for plugin
// properties and for action parameters - never as the id written in the config.
// Keeping the item lists here and resolving through `fromCombo` means the ids
// used in code can never drift out of step with the order shown in the editor,
// and a future release handing over the id string instead would still work.

function ids(items) {
  return items.map((item) => Object.keys(item)[0]);
}

export const ADD_BUTTON_ITEMS = [
  { value: "Value only" },
  { "value-array": "Value and array" },
  { "value-object-array": "Value, object and array" },
];

export const THEME_ITEMS = [
  { "construct-dark": "Construct dark" },
  { "construct-light": "Construct light" },
  { bare: "Bare (layout only)" },
];

export const CSS_MODE_ITEMS = [
  { append: "Add on top of what is there" },
  { replace: "Replace everything but the layout" },
];

export const TAB_BAR_ITEMS = [
  { auto: "Auto (hide when single)" },
  { always: "Always" },
  { never: "Never" },
];

export const CLOSE_BEHAVIOUR_ITEMS = [
  { trigger: "Trigger only" },
  { hide: "Hide" },
  { destroy: "Destroy" },
];

export const ADD_BUTTON_MODES = ids(ADD_BUTTON_ITEMS);
export const THEMES = ids(THEME_ITEMS);
export const CSS_MODES = ids(CSS_MODE_ITEMS);
export const TAB_BAR_MODES = ids(TAB_BAR_ITEMS);
export const CLOSE_BEHAVIOURS = ids(CLOSE_BEHAVIOUR_ITEMS);

/** Turn whatever Construct handed over into the id string the code uses. */
export function fromCombo(list, value, fallback = list[0]) {
  if (typeof value === "number") return list[value] ?? fallback;
  if (typeof value === "string" && list.includes(value)) return value;
  return fallback;
}
