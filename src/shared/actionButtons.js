// The custom action buttons the editor can show, defined once.
//
// A button is either "custom", which does nothing but fire a trigger and let
// the project decide what that means, or one of the built-in kinds below. The
// list is the single source of truth: the combo shown in the Add action button
// action is generated from it, and both sides of the boundary dispatch on the
// ids it declares, so a new built-in is added here and nowhere else.
//
// `where` says which side actually does the work. The clipboard, the file
// picker and the download all need the DOM, so they run on the DOM side and
// only report back. Emptying a document needs to know what the source is, so
// it runs on the runtime side.

import {
  emptyC2Array,
  emptyC2Dict,
  isC2ArrayObject,
  isC2DictObject,
} from "./c2formats.js";

export const ACTION_CUSTOM = "custom";
export const ACTION_COPY = "copy";
export const ACTION_SAVE = "save";
export const ACTION_IMPORT = "import";
export const ACTION_CLEAR = "clear";

export const ACTION_KINDS = [
  {
    id: ACTION_CUSTOM,
    name: "Custom (trigger only)",
    defaultLabel: "Action",
    title: "",
    where: "trigger",
  },
  {
    id: ACTION_COPY,
    name: "Copy data",
    defaultLabel: "Copy",
    title: "Copy this tab's JSON to the clipboard",
    where: "dom",
  },
  {
    id: ACTION_SAVE,
    name: "Save to file",
    defaultLabel: "Save",
    title: "Save this tab's JSON to a file",
    where: "dom",
  },
  {
    id: ACTION_IMPORT,
    name: "Import from file",
    defaultLabel: "Import",
    title: "Replace this tab's JSON from a file",
    where: "dom",
  },
  {
    id: ACTION_CLEAR,
    name: "Clear",
    defaultLabel: "Clear",
    title: "Empty this tab",
    where: "runtime",
  },
];

/** The combo item shape Construct wants: one { id: "Display name" } per entry. */
export const ACTION_KIND_ITEMS = ACTION_KINDS.map((kind) => ({
  [kind.id]: kind.name,
}));

/** Index order is the wire format, so ids are read back through fromCombo. */
export const ACTION_KIND_IDS = ACTION_KINDS.map((kind) => kind.id);

export function actionKind(id) {
  return ACTION_KINDS.find((kind) => kind.id === id) ?? ACTION_KINDS[0];
}

/**
 * What an empty document looks like for each source.
 *
 * A JSON object can hold anything, so it empties to an empty object. An Array
 * and a Dictionary are projected into the c2 wrappers by their adapters and
 * have to stay in that shape to be written back at all, so they empty to an
 * empty wrapper rather than to {}.
 *
 * Globals are absent on purpose: a project's set of them is fixed at build
 * time, so there is nothing to clear and the button is shown disabled.
 */
export function emptyDocFor(sourceKind) {
  switch (sourceKind) {
    case "array":
      return emptyC2Array();
    case "dictionary":
      return emptyC2Dict();
    case "json":
      return {};
    default:
      return null;
  }
}

/** Whether Clear and Import have anything they can do on this source. */
export function canReplaceDoc(sourceKind) {
  return sourceKind !== "globals";
}

/**
 * Check an imported document against the source it is about to be written to.
 *
 * Deliberately strict for the wrapper sources: a bare nested array is not
 * accepted for an Array tab, because guessing at a shape here would write
 * something the adapter then silently drops. Returns null when it is fine, or
 * the reason to show otherwise.
 */
export function importProblem(doc, sourceKind) {
  switch (sourceKind) {
    case "array":
      return isC2ArrayObject(doc)
        ? null
        : "This tab edits an Array, so the file has to hold a c2array: " +
            '{"c2array":true,"size":[w,h,d],"data":[[[…]]]}.';

    case "dictionary":
      return isC2DictObject(doc)
        ? null
        : "This tab edits a Dictionary, so the file has to hold a c2dictionary: " +
            '{"c2dictionary":true,"data":{…}}.';

    case "globals":
      return "Global variables are fixed by the project and cannot be imported.";

    default:
      return doc === undefined ? "The file did not hold any JSON." : null;
  }
}

/** Only used for the default download name, so anything unusable is dropped. */
export function safeFilename(name, fallback = "data") {
  const cleaned = String(name ?? "")
    .replace(/[\\/:*?"<>|]/g, "")
    .trim();
  const base = cleaned || fallback;
  return base.toLowerCase().endsWith(".json") ? base : `${base}.json`;
}
