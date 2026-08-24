// Global variables projected into an object.
//
// A project's set of globals is fixed at build time, so keys added or removed
// in the editor are ignored rather than silently doing nothing, and each write
// is coerced back to the type the variable already holds.

import { isPlainObject, coerceLike } from "../../shared/jsonUtils.js";

/**
 * Own enumerable keys is the expected shape, but accessor properties defined
 * on the object or its prototype would not show up there, so fall back rather
 * than reporting a project with no globals.
 */
function globalVarNames(vars) {
  let names = Object.keys(vars);
  if (names.length) return names;

  names = Object.getOwnPropertyNames(vars).filter((k) => k !== "constructor");
  if (names.length) return names;

  const proto = Object.getPrototypeOf(vars);
  if (!proto || proto === Object.prototype) return [];
  return Object.getOwnPropertyNames(proto).filter((k) => k !== "constructor");
}

export const globalsSource = {
  kind: "globals",

  matches() {
    return false; // Never auto-detected: it is picked explicitly.
  },

  read(_inst, runtime) {
    const vars = runtime?.globalVars;
    if (!vars) return null;

    const names = globalVarNames(vars);
    if (!names.length) return null;

    const out = {};
    for (const key of names) out[key] = vars[key];
    return out;
  },

  write(_inst, doc, runtime) {
    const vars = runtime?.globalVars;
    if (!vars || !isPlainObject(doc)) return;

    for (const key of globalVarNames(vars)) {
      if (!Object.prototype.hasOwnProperty.call(doc, key)) continue;
      vars[key] = coerceLike(vars[key], doc[key]);
    }
  },
};
