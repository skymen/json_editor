// Applying an edit op to a document.
//
// Shared rather than runtime-only: the runtime applies ops to the real source,
// and the DOM side replays the ones it has queued but not yet sent so that a
// button reading the document sees what is on screen rather than the last
// version the runtime echoed back.
//
// Ops arrive from the DOM side naming their target with a key array. Resolving
// that array is the only place that has to know a c2array or c2dictionary can
// be stored as a *string*: the walk steps into such a value transparently and
// re-serialises it on the way back out, so no op carries a special case for it.

import { OP } from "./protocol.js";
import { isContainer, moveIn } from "./jsonUtils.js";
import {
  detectC2Wrapper,
  c2Dimensions,
  resizeC2Array,
  removeC2Column,
} from "./c2formats.js";
import { toPublicPath, pathFromKeys } from "./paths.js";

function normaliseKey(container, key) {
  return Array.isArray(container) ? Number(key) : key;
}

/**
 * Walk `keys` from the document root.
 *
 * Returns the value found plus the list of re-serialisations that have to run
 * afterwards, outermost last, or null if the path does not exist.
 */
function resolveContainer(doc, keys, detect) {
  const restores = [];
  let value = doc;

  for (const rawKey of keys) {
    if (!isContainer(value)) return null;

    const key = normaliseKey(value, rawKey);
    let next = value[key];

    const wrapper = detectC2Wrapper(next, detect);
    if (wrapper && wrapper.fromString) {
      const holder = value;
      const parsed = wrapper.wrapper;
      restores.unshift(() => {
        holder[key] = JSON.stringify(parsed);
      });
      next = parsed;
    }

    value = next;
  }

  return { value, restores };
}

/** Resolve to the container holding the last key, plus that key. */
function resolveSlot(doc, keys, detect) {
  if (!keys.length) return null;

  const parent = resolveContainer(doc, keys.slice(0, -1), detect);
  if (!parent || !isContainer(parent.value)) return null;

  return {
    container: parent.value,
    key: normaliseKey(parent.value, keys[keys.length - 1]),
    restores: parent.restores,
  };
}

/** Rename a key without moving it to the end of the object. */
function renameInPlace(container, from, to) {
  const rebuilt = {};
  for (const key of Object.keys(container))
    rebuilt[key === from ? to : key] = container[key];

  for (const key of Object.keys(container)) delete container[key];
  Object.assign(container, rebuilt);
}

/**
 * Apply one op to `doc` in place.
 *
 * Returns a report for the trigger the op fires, or null if the op could not
 * be applied - a stale path, usually, from an edit racing a change made by
 * events.
 */
export function applyOp(doc, op, detect) {
  const keys = op.keys ?? [];

  switch (op.kind) {
    case OP.SET_VALUE: {
      const slot = resolveSlot(doc, keys, detect);
      if (!slot || !isContainer(slot.container)) return null;

      const oldValue = slot.container[slot.key];
      slot.container[slot.key] = op.value;
      run(slot.restores);
      return report(keys, String(slot.key), op.value, oldValue);
    }

    case OP.ADD_KEY: {
      const target = resolveContainer(doc, keys, detect);
      if (!target || !isContainer(target.value)) return null;

      target.value[op.key] = op.value;
      run(target.restores);
      return report([...keys, op.key], op.key, op.value, undefined);
    }

    case OP.REMOVE_KEY: {
      const target = resolveContainer(doc, keys, detect);
      if (!target || !isContainer(target.value)) return null;

      const oldValue = target.value[op.key];
      delete target.value[op.key];
      run(target.restores);
      return report([...keys, op.key], op.key, undefined, oldValue);
    }

    case OP.RENAME_KEY: {
      const target = resolveContainer(doc, keys, detect);
      if (!target || !isContainer(target.value)) return null;
      if (!(op.key in target.value) || op.newKey in target.value) return null;

      const value = target.value[op.key];
      renameInPlace(target.value, op.key, op.newKey);
      run(target.restores);
      return report([...keys, op.newKey], op.newKey, value, op.key);
    }

    case OP.ADD_ELEMENT: {
      const target = resolveContainer(doc, keys, detect);
      if (!Array.isArray(target?.value)) return null;

      target.value.push(op.value);
      run(target.restores);
      const index = target.value.length - 1;
      return report([...keys, index], String(index), op.value, undefined);
    }

    case OP.REMOVE_ELEMENT: {
      const target = resolveContainer(doc, keys, detect);
      if (!Array.isArray(target?.value)) return null;
      if (op.index < 0 || op.index >= target.value.length) return null;

      const [oldValue] = target.value.splice(op.index, 1);
      run(target.restores);
      return report([...keys, op.index], String(op.index), undefined, oldValue);
    }

    case OP.MOVE_ELEMENT: {
      const target = resolveContainer(doc, keys, detect);
      if (!Array.isArray(target?.value)) return null;

      const { from, to } = op;
      const last = target.value.length - 1;
      if (from < 0 || from > last || to < 0 || to > last) return null;

      moveIn(target.value, from, to);
      run(target.restores);
      return report([...keys, to], String(to), to, from);
    }

    case OP.C2_RESIZE: {
      const arr = resolveC2Array(doc, keys, detect);
      if (!arr) return null;

      resizeC2Array(arr.value, op.w, op.h, op.d);
      run(arr.restores);
      return report(keys, "size", `${op.w}x${op.h}x${op.d}`, undefined);
    }

    case OP.C2_ADD_COLUMN: {
      const arr = resolveC2Array(doc, keys, detect);
      if (!arr) return null;

      const [w, h, d] = c2Dimensions(arr.value);
      resizeC2Array(arr.value, w + 1, h, d);
      run(arr.restores);
      return report([...keys, "data", w], String(w), undefined, undefined);
    }

    case OP.C2_REMOVE_COLUMN: {
      const arr = resolveC2Array(doc, keys, detect);
      if (!arr) return null;

      removeC2Column(arr.value, op.index);
      run(arr.restores);
      return report(
        [...keys, "data", op.index],
        String(op.index),
        undefined,
        undefined,
      );
    }

    default:
      return null;
  }
}

function resolveC2Array(doc, keys, detect) {
  const target = resolveContainer(doc, keys, detect);
  if (!target || !isContainer(target.value)) return null;
  if (!Array.isArray(target.value["data"])) return null;
  return target;
}

function run(restores) {
  for (const restore of restores) restore();
}

function report(keys, key, value, oldValue) {
  return {
    path: toPublicPath(pathFromKeys(keys.map(String))),
    key,
    value,
    oldValue,
  };
}
