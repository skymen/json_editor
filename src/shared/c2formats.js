// Construct serialises Array and Dictionary objects into two wrapper shapes:
//
//   {"c2array":true,"size":[w,h,d],"data":[[[cell]]]}
//   {"c2dictionary":true,"data":{key:value}}
//
// Both turn up inside save data either as a nested object or, when they came
// from an AsJSON expression, as a *string* holding one. Each of those four
// cases is detected independently, because a project may legitimately want a
// string that merely looks like one left alone.

import { isPlainObject, fillFor } from "./jsonUtils.js";

export const C2_ARRAY = "c2array";
export const C2_DICT = "c2dictionary";

export function isC2ArrayObject(v) {
  return isPlainObject(v) && v["c2array"] === true && Array.isArray(v["data"]);
}

export function isC2DictObject(v) {
  return (
    isPlainObject(v) && v["c2dictionary"] === true && isPlainObject(v["data"])
  );
}

function parseWrapperString(value, marker, test) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  // Cheap rejections first: this runs on every string value in the tree.
  if (!trimmed.startsWith("{") || !trimmed.includes(marker)) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (test(parsed)) return parsed;
  } catch {
    // Not JSON after all, so it stays an ordinary string value.
  }
  return null;
}

/**
 * Work out whether a value should be shown as one of the C2 wrappers.
 *
 * `detect` carries the four toggles: c2array, c2arrayString, c2dictionary,
 * c2dictionaryString. Returns null when the value is just a value.
 *
 * A descriptor is { kind, wrapper, fromString }. `wrapper` is the object form:
 * for a string source it is a freshly parsed copy, and the caller is
 * responsible for re-serialising it on commit.
 */
export function detectC2Wrapper(value, detect) {
  if (detect.c2array && isC2ArrayObject(value))
    return { kind: C2_ARRAY, wrapper: value, fromString: false };

  if (detect.c2dictionary && isC2DictObject(value))
    return { kind: C2_DICT, wrapper: value, fromString: false };

  if (detect.c2arrayString) {
    const parsed = parseWrapperString(value, C2_ARRAY, isC2ArrayObject);
    if (parsed) return { kind: C2_ARRAY, wrapper: parsed, fromString: true };
  }

  if (detect.c2dictionaryString) {
    const parsed = parseWrapperString(value, C2_DICT, isC2DictObject);
    if (parsed) return { kind: C2_DICT, wrapper: parsed, fromString: true };
  }

  return null;
}

/**
 * The dimensions a c2array actually occupies, which can be larger than its
 * declared size if the data outgrew it. Width follows the data, height and
 * depth are at least one.
 */
export function c2Dimensions(arr) {
  const size = Array.isArray(arr["size"]) ? arr["size"] : [];
  const data = arr["data"];

  const w = Math.max(data.length, Math.floor(size[0]) || 0);
  let h = Math.max(1, Math.floor(size[1]) || 1);
  let d = Math.max(1, Math.floor(size[2]) || 1);

  for (const plane of data) {
    if (!Array.isArray(plane)) continue;
    h = Math.max(h, plane.length);
    for (const row of plane) if (Array.isArray(row)) d = Math.max(d, row.length);
  }

  return [w, h, d];
}

export function* c2Cells(data) {
  for (const plane of data) {
    if (!Array.isArray(plane)) continue;
    for (const row of plane) {
      if (!Array.isArray(row)) continue;
      yield* row;
    }
  }
}

/**
 * Grow, shrink and square off a c2array in place, filling new cells with a
 * value inferred from the ones already there. Returns whether anything moved,
 * so the caller only commits when it has to.
 */
export function resizeC2Array(arr, w, h, d) {
  w = Math.max(0, Math.floor(w) || 0);
  h = Math.max(1, Math.floor(h) || 1);
  d = Math.max(1, Math.floor(d) || 1);

  const old = arr["data"];
  const size = arr["size"];
  const fill = fillFor(c2Cells(old));
  const data = [];

  let changed =
    old.length !== w ||
    !Array.isArray(size) ||
    size.length !== 3 ||
    size[0] !== w ||
    size[1] !== h ||
    size[2] !== d;

  for (let x = 0; x < w; ++x) {
    const oldPlane = Array.isArray(old[x]) ? old[x] : null;
    if (!oldPlane || oldPlane.length !== h) changed = true;

    const plane = [];
    for (let y = 0; y < h; ++y) {
      const oldRow = oldPlane && Array.isArray(oldPlane[y]) ? oldPlane[y] : null;
      if (!oldRow || oldRow.length !== d) changed = true;

      const row = [];
      for (let z = 0; z < d; ++z) {
        const cell = oldRow ? oldRow[z] : undefined;
        const next =
          typeof cell === "number" || typeof cell === "string" ? cell : fill;
        if (next !== cell) changed = true;
        row.push(next);
      }
      plane.push(row);
    }
    data.push(plane);
  }

  arr["data"] = data;
  arr["size"] = [w, h, d];
  return changed;
}

/** Remove one x column, keeping the declared size in step with the data. */
export function removeC2Column(arr, index) {
  const [, h, d] = c2Dimensions(arr);
  arr["data"].splice(index, 1);
  arr["size"] = [arr["data"].length, h, d];
}

export function emptyC2Array() {
  return { c2array: true, size: [0, 1, 1], data: [] };
}

export function emptyC2Dict() {
  return { c2dictionary: true, data: {} };
}
