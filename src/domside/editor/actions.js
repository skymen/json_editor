// What the built-in action buttons actually do, on the side that has a DOM.
//
// Copy, Save and Import all need something only the page can give: the
// clipboard, a download, a file dialog. Each one works on the open tab and
// nothing else, and each reports the press back so the project can react to it
// even when the button did its own work.
//
// Import is the only one that produces a document. It is validated here rather
// than after the trip to the runtime, so a bad file can say what was wrong
// while the user is still looking at the picker.

import { importProblem, safeFilename } from "../../shared/actionButtons.js";

const MIME = "application/json";

/** Documents are plain JSON, so a failure here means there is nothing to give. */
function toText(doc) {
  if (doc === null || doc === undefined) return null;

  try {
    return JSON.stringify(doc, null, 2);
  } catch {
    return null;
  }
}

export async function copyToClipboard(doc) {
  const text = toText(doc);
  if (text === null) return;

  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // Falls through: the clipboard API needs a permission the page may not
    // have, and the old selection trick still works when it does not.
  }

  const scratch = document.createElement("textarea");
  scratch.value = text;
  scratch.setAttribute("readonly", "");
  scratch.style.position = "fixed";
  scratch.style.opacity = "0";
  document.body.append(scratch);
  scratch.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  scratch.remove();

  if (!copied) alert("The clipboard is not available here.");
}

export async function saveToFile(ctx, doc) {
  const text = toText(doc);
  if (text === null) return;

  // The open tab's label is the name the user already knows this data by.
  const name = safeFilename(ctx.tabs.labelOf(ctx.tabs.activeId));

  // A real Save As dialog where the browser has one, so the file lands where
  // it was asked for rather than in the download folder.
  if (typeof self.showSaveFilePicker === "function") {
    try {
      const handle = await self.showSaveFilePicker({
        suggestedName: name,
        types: [{ description: "JSON", accept: { [MIME]: [".json"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return;
    } catch (e) {
      // A cancelled picker is not a failure, and anything else falls back.
      if (e && e.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(new Blob([text], { type: MIME }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Read a file into the open tab.
 *
 * Nothing is sent unless the document suits the tab's source, because writing
 * a shape the adapter cannot take would drop the file on the floor without
 * saying so.
 */
export function importFromFile(ctx, action) {
  const tabId = ctx.tabs.activeId;
  const sourceKind = ctx.tabs.kindOf(tabId);

  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = ".json,application/json";
  picker.style.display = "none";

  picker.addEventListener("change", async () => {
    const file = picker.files && picker.files[0];
    picker.remove();
    if (!file) return;

    let doc;
    try {
      doc = JSON.parse(await file.text());
    } catch (e) {
      alert(`${file.name} does not hold valid JSON.\n\n${e.message}`);
      return;
    }

    const problem = importProblem(doc, sourceKind);
    if (problem) {
      alert(problem);
      return;
    }

    ctx.emitAction(action, { doc });
  });

  document.body.append(picker);
  picker.click();
}

/**
 * Run whatever the button does on this side.
 *
 * Returns whether it will report the press itself. Only Import does: it has to
 * wait for a file dialog it may never come back from, and a file it may end up
 * rejecting, so reporting up front would fire a trigger for an import that
 * never happened.
 */
export function runBuiltIn(ctx, action, doc) {
  switch (action.kind) {
    case "copy":
      copyToClipboard(doc);
      return false;
    case "save":
      saveToFile(ctx, doc);
      return false;
    case "import":
      importFromFile(ctx, action);
      return true;
    default:
      // custom and clear have nothing to do here: the runtime handles both.
      return false;
  }
}

/** Whether a button can do anything at all on the tab that is open. */
export function isActionDisabled(ctx, action) {
  const sourceKind = ctx.tabs.kindOf(ctx.tabs.activeId);
  if (action.kind !== "clear" && action.kind !== "import") return false;
  return sourceKind === "globals";
}
