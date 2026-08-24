import {
  ADDON_CATEGORY,
  ADDON_TYPE,
  PLUGIN_TYPE,
  PROPERTY_TYPE,
} from "./template/enums.js";
import _version from "./version.js";
import {
  ADD_BUTTON_ITEMS,
  THEME_ITEMS,
  CSS_MODE_ITEMS,
  TAB_BAR_ITEMS,
  CLOSE_BEHAVIOUR_ITEMS,
} from "./src/shared/combos.js";

export const addonType = ADDON_TYPE.PLUGIN;
export const type = PLUGIN_TYPE.DOM;
export const id = "skymen_JSONEditor";
export const name = "JSON Editor";
export const version = _version;
export const minConstructVersion = undefined;
export const author = "skymen";
export const website = "https://www.construct.net";
export const documentation = "https://www.construct.net";
export const description =
  "An in-game tree editor for JSON, Dictionary and Array objects, and for global variables.";
export const category = ADDON_CATEGORY.FORM_CONTROLS;

export const hasDomside = true;
export const files = {
  extensionScript: {
    enabled: false,
    watch: true,
    targets: ["x86", "x64"],
    name: "MyExtension",
  },
  fileDependencies: [],
  remoteFileDependencies: [],
  cordovaPluginReferences: [],
  cordovaResourceFiles: [],
};

export const aceCategories = {
  source: "Source",
  tabs: "Tabs",
  theme: "Theme",
  "config-top-bar": "Config: top bar",
  "config-editing": "Config: editing",
  navigation: "Navigation",
  events: "Events",
};

export const info = {
  icon: "icon.svg",
  Set: {
    CanBeBundled: true,
    IsDeprecated: false,
    GooglePlayServicesEnabled: false,

    IsOnlyOneAllowed: false,

    IsResizable: true,
    IsRotatable: false,
    Is3D: false,
    HasImage: false,
    IsTiled: false,
    SupportsZElevation: false,
    SupportsColor: false,
    SupportsEffects: false,
    MustPreDraw: false,

    IsSingleGlobal: false,
  },
  AddCommonACEs: {
    Position: true,
    SceneGraph: false,
    Size: true,
    Angle: false,
    Appearance: true,
    ZOrder: false,
  },
};

export const properties = [
  // ---------------------------------------------------------------- Source
  {
    type: PROPERTY_TYPE.GROUP,
    id: "group-source",
    options: {},
    name: "Source",
    desc: "What the editor reads from and writes back to.",
  },
  {
    type: PROPERTY_TYPE.OBJECT,
    id: "source-object",
    options: {
      allowedPluginIds: ["Json", "Dictionary", "Arr"],
    },
    name: "Source object",
    desc: "The JSON, Dictionary or Array object to edit; how to read it is worked out from its type. Leave empty to bind from events instead.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "edit-globals",
    options: { initialValue: false },
    name: "Edit global variables",
    desc: "Edit the project's global variables instead of an object. The source object is ignored when this is on.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "auto-refresh",
    options: { initialValue: true },
    name: "Auto refresh",
    desc: "Re-read the source periodically so changes made by events show up in the editor.",
  },
  {
    type: PROPERTY_TYPE.INTEGER,
    id: "refresh-interval",
    options: { initialValue: 200, minValue: 0 },
    name: "Refresh interval (ms)",
    desc: "How often the source is re-read while Auto refresh is on.",
  },

  // --------------------------------------------------------------- Editing
  {
    type: PROPERTY_TYPE.GROUP,
    id: "group-editing",
    options: {},
    name: "Editing",
    desc: "What the user is allowed to change.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "allow-edit-values",
    options: { initialValue: true },
    name: "Edit values",
    desc: "Allow editing scalar values. Turn off for a read-only viewer.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "allow-object-keys",
    options: { initialValue: false },
    name: "Add/remove object keys",
    desc: "Show an add bar and a remove button on the keys of plain objects.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "allow-rename-keys",
    options: { initialValue: false },
    name: "Rename keys",
    desc: "Make object key names editable in place.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "allow-array-elements",
    options: { initialValue: true },
    name: "Add/remove array elements",
    desc: "Show the add bar and remove buttons on arrays.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "allow-reorder",
    options: { initialValue: true },
    name: "Reorder array elements",
    desc: "Show the move up and move down buttons on arrays.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "allow-resize-c2array",
    options: { initialValue: true },
    name: "Resize c2arrays",
    desc: "Allow the width, height and depth of a c2array to be changed.",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "add-buttons",
    options: {
      initialValue: "value-array",
      items: ADD_BUTTON_ITEMS,
    },
    name: "Add buttons",
    desc: "Which kinds of new entry the add bar offers.",
  },

  // ------------------------------------------------------------ C2 formats
  {
    type: PROPERTY_TYPE.GROUP,
    id: "group-c2",
    options: {},
    name: "C2 formats",
    desc: "Special handling for the c2array and c2dictionary wrappers Construct writes.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "detect-c2array",
    options: { initialValue: true },
    name: "Detect c2array",
    desc: "Show an object holding c2array/data/size as an editable grid.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "detect-c2array-string",
    options: { initialValue: false },
    name: "Detect c2array in strings",
    desc: "Also parse string values that hold a serialised c2array, and write them back as strings.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "detect-c2dictionary",
    options: { initialValue: true },
    name: "Detect c2dictionary",
    desc: "Show an object holding c2dictionary/data as a flat list of keys.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "detect-c2dictionary-string",
    options: { initialValue: true },
    name: "Detect c2dictionary in strings",
    desc: "Also parse string values that hold a serialised c2dictionary, and write them back as strings.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "show-c2array-dims",
    options: { initialValue: true },
    name: "Show c2array size",
    desc: "Show the width x height x depth inputs on a c2array.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "show-c2array-zbar",
    options: { initialValue: true },
    name: "Show c2array z plane bar",
    desc: "Show the z plane selector when a c2array is more than one plane deep.",
  },

  // ----------------------------------------------------------------- Theme
  {
    type: PROPERTY_TYPE.GROUP,
    id: "group-theme",
    options: {},
    name: "Theme",
    desc: "How the editor is styled. Layout is fixed; a theme only describes colour.",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "theme",
    options: {
      initialValue: "construct-dark",
      items: THEME_ITEMS,
    },
    name: "Theme",
    desc: "Which built-in theme to start with.",
  },
  {
    type: PROPERTY_TYPE.PROJECTFILE,
    id: "custom-css",
    options: { filter: ".css" },
    name: "Custom CSS",
    desc: "A CSS file from the project's Files folder, loaded on startup.",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "custom-css-mode",
    options: {
      initialValue: "append",
      items: CSS_MODE_ITEMS,
    },
    name: "Custom CSS mode",
    desc: "Whether the custom CSS file adds to the built-in theme, so it only has to override what it wants, or replaces it outright.",
  },

  // --------------------------------------------------------------- Top bar
  {
    type: PROPERTY_TYPE.GROUP,
    id: "group-top-bar",
    options: {},
    name: "Top bar",
    desc: "Which controls the editor shows, and what closing it does.",
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "ui-scale",
    options: { initialValue: 0.6, minValue: 0.05 },
    name: "UI scale",
    desc: "Multiplies the base font size the whole editor is laid out in.",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "tab-bar",
    options: {
      initialValue: "auto",
      items: TAB_BAR_ITEMS,
    },
    name: "Tab bar",
    desc: "When to show the tab bar.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "show-filter",
    options: { initialValue: true },
    name: "Show filter box",
    desc: "Show the key filter input in the toolbar.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "show-collapse-all",
    options: { initialValue: true },
    name: "Show collapse all",
    desc: "Show the Collapse all button in the toolbar.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "show-close",
    options: { initialValue: false },
    name: "Show close button",
    desc: "Show a close button in the tab bar.",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "close-behaviour",
    options: {
      initialValue: "trigger",
      items: CLOSE_BEHAVIOUR_ITEMS,
    },
    name: "Close behaviour",
    desc: "What the close button does after flushing pending edits. On close clicked fires either way.",
  },

  // -------------------------------------------------------------- Advanced
  {
    type: PROPERTY_TYPE.GROUP,
    id: "group-advanced",
    options: {},
    name: "Advanced",
    desc: "Tuning that rarely needs changing.",
  },
  {
    type: PROPERTY_TYPE.INTEGER,
    id: "long-value-chars",
    options: { initialValue: 40, minValue: 1 },
    name: "Long value length",
    desc: "Values longer than this get a resizable multi-line field instead of a single line one.",
  },
  {
    type: PROPERTY_TYPE.INTEGER,
    id: "commit-debounce",
    options: { initialValue: 200, minValue: 0 },
    name: "Commit debounce (ms)",
    desc: "How long typing pauses before an edit is written back to the source.",
  },
  {
    type: PROPERTY_TYPE.INTEGER,
    id: "press-freeze",
    options: { initialValue: 1000, minValue: 0 },
    name: "Press freeze (ms)",
    desc: "Refreshes are held off for this long while a pointer is held down, so the tree cannot rebuild mid-drag.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "block-input",
    options: { initialValue: true },
    name: "Block input",
    desc: "Stop clicks and key presses inside the editor from reaching the Mouse, Touch and Keyboard objects.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "override-cursor",
    options: { initialValue: true },
    name: "Override cursor",
    desc: "Force a normal mouse cursor inside the editor, even if the game hides it.",
  },
  {
    type: PROPERTY_TYPE.TEXT,
    id: "elem-id",
    options: { initialValue: "" },
    name: "ID",
    desc: "An optional id for the host element, allowing it to be positioned with CSS. Only used when the element is created.",
  },
  {
    type: PROPERTY_TYPE.TEXT,
    id: "elem-class",
    options: { initialValue: "" },
    name: "Class",
    desc: "An optional class for the host element. Only used when the element is created.",
  },
  {
    type: PROPERTY_TYPE.TEXT,
    id: "style-attribute",
    options: { initialValue: "" },
    name: "Style attribute",
    desc: "Initial content of the style attribute for the host element. Only used when the element is created.",
  },
];
