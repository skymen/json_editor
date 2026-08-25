// The contract between the runtime instance and the DOM handler. Both sides
// import this file, so a message name only ever exists in one place.
//
// Direction of travel:
//
//   runtime -> dom   CONFIG, TABS, DATA, STYLE, COMMAND
//   dom -> runtime   OP, EVENT
//
// DATA carries a whole document per tab. That is the deliberately unoptimised
// part of v1 and the only message a future diff transport has to replace; it
// is produced in one place (runtime/sync.js) and consumed in one place
// (domside/index.js), so nothing else needs to know.

export const MSG = {
  CONFIG: "config",
  TABS: "tabs", // { tabs: [{ id, label, structural }], activeId }
  DATA: "data",
  STYLE: "style",
  COMMAND: "command",
  OP: "op",
  EVENT: "event",
};

/**
 * Edit operations. Every op names its target with a key array, walked from the
 * document root. The runtime resolves that path itself, stepping transparently
 * through any c2array or c2dictionary that is stored as a string and
 * re-serialising it afterwards, so no op needs to know how a wrapper was
 * stored.
 */
export const OP = {
  SET_VALUE: "setValue", // { keys, value }
  ADD_KEY: "addKey", // { keys, key, value }
  REMOVE_KEY: "removeKey", // { keys, key }
  RENAME_KEY: "renameKey", // { keys, key, newKey }
  ADD_ELEMENT: "addElement", // { keys, value }
  REMOVE_ELEMENT: "removeElement", // { keys, index }
  MOVE_ELEMENT: "moveElement", // { keys, from, to }
  C2_RESIZE: "c2Resize", // { keys, w, h, d }
  C2_ADD_COLUMN: "c2AddColumn", // { keys }
  C2_REMOVE_COLUMN: "c2RemoveColumn", // { keys, index }
};

/** Which trigger an op fires once the runtime has applied it. */
export const OP_TRIGGER = {
  [OP.SET_VALUE]: "OnValueChanged",
  [OP.ADD_KEY]: "OnKeyAdded",
  [OP.REMOVE_KEY]: "OnKeyRemoved",
  [OP.RENAME_KEY]: "OnKeyRenamed",
  [OP.ADD_ELEMENT]: "OnElementAdded",
  [OP.REMOVE_ELEMENT]: "OnElementRemoved",
  [OP.MOVE_ELEMENT]: "OnElementReordered",
  [OP.C2_RESIZE]: "OnValueChanged",
  [OP.C2_ADD_COLUMN]: "OnElementAdded",
  [OP.C2_REMOVE_COLUMN]: "OnElementRemoved",
};

/** Notifications from the UI that are not edits. */
export const EVENT = {
  FOCUS: "focus", // { path }
  BLUR: "blur", // { path }
  CLOSE: "close", // {}
  TAB_SELECTED: "tabSelected", // { tabId }
  FILTER: "filter", // { text }
  VIEW_STATE: "viewState", // { tabs: {...}, active }
};

/** Navigation and chrome commands pushed from actions. */
export const COMMAND = {
  COLLAPSE_ALL: "collapseAll", // {}
  EXPAND_ALL: "expandAll", // {}
  EXPAND_PATH: "expandPath", // { keys }
  COLLAPSE_PATH: "collapsePath", // { keys }
  SCROLL_TO_PATH: "scrollToPath", // { keys }
  SET_FILTER: "setFilter", // { text }
  SELECT_TAB: "selectTab", // { tabId }
  FLUSH: "flush", // {}
  RESTORE_VIEW: "restoreView", // { tabs: {...}, active }
};

/** What a STYLE message asks for. */
export const STYLE_MODE = {
  THEME: "theme", // { theme } - a built-in, clearing anything added on top
  APPEND: "append", // { css }  - stacked on the current theme
  REPLACE: "replace", // { css }  - becomes the theme
};

/** Everything the DOM side needs to know to render. Built by the runtime. */
export function defaultConfig() {
  return {
    permissions: {
      editValues: true,
      objectKeys: false,
      renameKeys: false,
      arrayElements: true,
      reorder: true,
      resizeC2Array: true,
      addButtons: "value-array",
    },
    detect: {
      c2array: true,
      c2arrayString: false,
      c2dictionary: true,
      c2dictionaryString: true,
      c2ArrayDims: true,
      c2ArrayZBar: true,
    },
    chrome: {
      tabBar: "auto",
      filter: true,
      collapseAll: true,
      close: false,
    },
    tuning: {
      uiScale: 0.6,
      longValueChars: 40,
      commitDebounce: 200,
      pressFreeze: 1000,
      blockInput: true,
      overrideCursor: true,
    },
  };
}
