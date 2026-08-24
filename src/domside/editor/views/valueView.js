// Scalar rows and the fields inside them.

import { make, selectAllOnFocus } from "../dom.js";
import { neighbourField } from "../focus.js";
import { formatValue, parseValue, typeClass } from "../../../shared/jsonUtils.js";
import { OP } from "../../../shared/protocol.js";
import { pathKeys } from "../../../shared/paths.js";

const TYPE_CLASSES = ["je-t-number", "je-t-string", "je-t-keyword"];

/**
 * An editable field bound to container[key].
 *
 * `scalarsOnly` narrows what is accepted to numbers and strings, for the
 * places that physically cannot hold anything else: c2array cells,
 * c2dictionary values, and Dictionary or Array bindings.
 */
export function buildValueField(ctx, container, key, path, opts = {}) {
  const { scalarsOnly = false } = opts;
  const editable = ctx.perms.editValues && !opts.readOnly;

  const value = container[key];
  const text = formatValue(value);

  const isLong =
    text.length > ctx.tuning.longValueChars || text.includes("\n");
  const input = make(isLong ? "textarea" : "input", "je-val");
  if (!isLong) input.type = "text";
  input.spellcheck = false;
  input.value = text;
  input._jePath = path;
  input.disabled = !editable;
  if (editable) selectAllOnFocus(input);

  const markValid = (v) => {
    input.classList.remove("je-invalid", ...TYPE_CLASSES);
    input.classList.add(typeClass(v));
    input.title = "";
  };
  const markInvalid = (error) => {
    input.classList.remove(...TYPE_CLASSES);
    input.classList.add("je-invalid");
    input.title = error;
  };
  markValid(value);

  if (!editable) return input;

  // What Escape reverts to. Re-taken on focus, which a rebuilt field is given
  // as it is restored, so it tracks the source's latest value rather than
  // whatever was there when the edit started.
  let original = value;
  input.addEventListener("focus", () => {
    original = container[key];
    ctx.notifyFocus(path);
  });

  input.addEventListener("input", () => {
    const result = parseValue(input.value, scalarsOnly);
    if (!result.ok) {
      markInvalid(result.error);
      return;
    }
    markValid(result.value);
    container[key] = result.value;
    ctx.queueValue(pathKeys(path), result.value);
  });

  input.addEventListener("blur", () => {
    if (input.isConnected) ctx.flushPending();
    ctx.notifyBlur(path);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      container[key] = original;
      input.value = formatValue(original);
      markValid(original);
      ctx.sendOp({ kind: OP.SET_VALUE, keys: pathKeys(path), value: original });
      input.blur();
      return;
    }

    if (e.key === "Tab") {
      const next = neighbourField(ctx.body, input, e.shiftKey ? -1 : 1);
      if (!next) return;
      e.preventDefault();
      next.focus();
      return;
    }

    if (e.key !== "Enter" || isLong) return;
    e.preventDefault();
    input.blur();
  });

  return input;
}

/** A whole `label  [field]  [actions]` line. */
export function buildValueRow(ctx, container, key, path, opts = {}) {
  const { isIndex = false, actions = null, scalarsOnly = false } = opts;

  const row = make("div", "je-row");
  const labelText = String(key);

  // Object rows may hand in their own label, which is an editable field when
  // renaming is allowed.
  let label = opts.label;
  if (!label) {
    label = make("span", isIndex ? "je-idx" : "je-key", labelText);
    label.title = labelText;
    if (!isIndex && ctx.isHit(labelText)) label.classList.add("je-hit");
  }

  const field = buildValueField(ctx, container, key, path, { scalarsOnly });
  if (field.tagName === "TEXTAREA") row.classList.add("je-block");

  row.append(
    label,
    make("span", "je-spacer"),
    field,
    actions ?? make("div", "je-actions"),
  );
  return row;
}
