// Keeping the caret still across a re-render.
//
// The tree is rebuilt wholesale whenever the source changes, which would
// otherwise throw away whatever the user was typing. Before rebuilding, the
// focused field is recorded by the path it edits; afterwards the field with
// that path is found again and the in-progress text and selection are put
// back. Buttons and the toolbar have no path, so those fall back to a trail of
// child indices from the body down to the element.
//
// Inside a shadow root, document.activeElement reports the host, so the root
// node has to be asked instead.

const FIELD_SELECTOR = ".je-val, .je-keyedit";

const NOTHING = {
  path: null,
  trail: null,
  text: null,
  start: null,
  end: null,
};

function trailTo(body, el) {
  const trail = [];
  let node = el;
  while (node && node !== body) {
    const parent = node.parentElement;
    if (!parent) return null;
    trail.unshift([...parent.children].indexOf(node));
    node = parent;
  }
  return node === body ? trail : null;
}

function elementAt(body, trail) {
  if (!trail) return null;
  let node = body;
  for (const i of trail) node = node?.children[i];
  return node ?? null;
}

export function findFieldByPath(body, path) {
  for (const input of body.querySelectorAll(FIELD_SELECTOR))
    if (input._jePath === path) return input;
  return null;
}

/** The next or previous value field in visual order, for Tab and Shift+Tab. */
export function neighbourField(body, from, step) {
  const fields = [...body.querySelectorAll(FIELD_SELECTOR)].filter(
    (f) => !f.closest("[hidden]") && !f.disabled,
  );
  return fields[fields.indexOf(from) + step] ?? null;
}

export function captureFocus(root, body) {
  if (!body || !root) return NOTHING;

  const active = root.activeElement;
  if (!active || !body.contains(active)) return NOTHING;

  const isField = active.tagName === "INPUT" || active.tagName === "TEXTAREA";

  return {
    path: active._jePath ?? null,
    trail: trailTo(body, active),
    text: isField ? active.value : null,
    start: isField ? active.selectionStart : null,
    end: isField ? active.selectionEnd : null,
  };
}

export function restoreFocus(body, focus) {
  const el =
    focus.path !== null
      ? findFieldByPath(body, focus.path)
      : elementAt(body, focus.trail);
  if (!el) return false;

  // Focus first: the field snapshots what Escape reverts to as it gains focus,
  // and that has to be the value just read, not the edit put back over it
  // below.
  el.focus({ preventScroll: true });

  if (focus.text !== null && typeof el.value === "string") {
    el.value = focus.text;
    // Re-parse and re-mark, but do not record it as an edit. Dispatching a
    // synthetic input event here would be indistinguishable from typing.
    el._jeRestoreText?.();
  }

  if (focus.start !== null && el.setSelectionRange)
    el.setSelectionRange(focus.start, focus.end);

  return true;
}
