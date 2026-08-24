// The Dictionary plugin, projected into the c2dictionary wrapper so the flat
// key/value view picks it up. Values are numbers and strings only, which is
// all a Dictionary can hold.
//
// The scripting interface is reached through whichever of its shapes the
// installed Construct release offers, because bulk access has moved around
// between versions. Everything is behind a capability check, so an unsupported
// release degrades to "nothing to show" rather than throwing on every tick.

import { isPlainObject } from "../../shared/jsonUtils.js";
import { emptyC2Dict } from "../../shared/c2formats.js";

function readEntries(inst) {
  if (typeof inst.getDataMap === "function") {
    const map = inst.getDataMap();
    if (map instanceof Map) return Object.fromEntries(map);
    if (isPlainObject(map)) return { ...map };
  }

  if (typeof inst.keys === "function" && typeof inst.getKey === "function") {
    const out = {};
    for (const key of inst.keys()) out[key] = inst.getKey(key);
    return out;
  }

  return null;
}

export const dictionarySource = {
  kind: "dictionary",

  matches(inst) {
    return (
      !!inst &&
      typeof inst.getJsonDataCopy !== "function" &&
      (typeof inst.getDataMap === "function" ||
        (typeof inst.keys === "function" && typeof inst.getKey === "function"))
    );
  },

  read(inst) {
    const entries = readEntries(inst);
    if (entries === null) return null;

    const wrapper = emptyC2Dict();
    wrapper.data = entries;
    return wrapper;
  },

  write(inst, doc) {
    const data = isPlainObject(doc?.data) ? doc.data : null;
    if (!data) return;

    if (typeof inst.setKey !== "function") return;

    const before = readEntries(inst) ?? {};

    for (const [key, value] of Object.entries(data)) {
      if (before[key] === value) continue;
      inst.setKey(key, value);
    }

    if (typeof inst.removeKey !== "function") return;
    for (const key of Object.keys(before))
      if (!Object.prototype.hasOwnProperty.call(data, key)) inst.removeKey(key);
  },
};
