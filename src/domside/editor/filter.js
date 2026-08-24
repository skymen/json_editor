// Key filtering.
//
// A key is *matched* when its own name contains the query. A key is *visible*
// when it is matched or has a matched key somewhere beneath it, which is what
// lets a deep hit stay reachable through its ancestors.
//
// The walk deliberately stops at C2 wrappers: their contents are data, not
// structure, and a c2array grid has no per-key rows to filter.

import { isPlainObject } from "../../shared/jsonUtils.js";
import { detectC2Wrapper } from "../../shared/c2formats.js";
import { SEP, ROOT_PATH } from "../../shared/paths.js";

export function keyMatches(key, query) {
  return String(key).toLowerCase().includes(query);
}

export function computeFilter(data, query, detect) {
  const visible = new Set();
  const matched = new Set();

  const walk = (container, path) => {
    if (!isPlainObject(container)) return false;
    if (detectC2Wrapper(container, detect)) return false;

    let any = false;
    for (const key of Object.keys(container)) {
      const childPath = path + SEP + key;
      const self = keyMatches(key, query);
      const below = walk(container[key], childPath);

      if (self) matched.add(childPath);
      if (self || below) {
        visible.add(childPath);
        any = true;
      }
    }
    return any;
  };

  walk(data, ROOT_PATH);
  return { visible, matched };
}
