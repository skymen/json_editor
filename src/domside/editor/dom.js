// Small element helpers shared by every view.

export function make(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

export function makeButton(cls, label, title, onClick, disabled = false) {
  const btn = make("button", cls ? `je-btn ${cls}` : "je-btn", label);
  btn.type = "button";
  btn.title = title;
  btn.disabled = disabled;
  btn.addEventListener("click", onClick);
  return btn;
}

/**
 * Keep a control from toggling the node it sits in. Head rows expand on click,
 * so anything interactive inside one has to swallow the event first.
 */
export function stopToggle(el) {
  for (const type of ["click", "pointerdown", "keydown"])
    el.addEventListener(type, (e) => e.stopPropagation());
}

/**
 * Select the whole value on the first click into a field. Editing a JSON
 * literal almost always means replacing it, not putting a caret in the middle
 * of it.
 */
export function selectAllOnFocus(input) {
  input.addEventListener("mousedown", (e) => {
    if (e.button !== 0 || input.getRootNode().activeElement === input) return;
    e.preventDefault();
    input.focus();
  });
  input.addEventListener("focus", () => input.select());
}

export function setHidden(el, hidden) {
  if (el) el.hidden = !!hidden;
}
