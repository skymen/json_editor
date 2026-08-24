// Two path representations live in this addon.
//
//   internal  "<SEP>player<SEP>inventory<SEP>2<SEP>name"
//     Used as a Map/Set key for expansion and z-slice state. The separator is a
//     control character so it cannot collide with anything a user would type as
//     a key, and it is never shown or accepted from outside.
//
//   public    "player.inventory.2.name"
//     What triggers report and what navigation actions accept. Matches the way
//     the built-in JSON plugin writes paths.
//
// Ops crossing the message boundary carry a key array instead, so neither
// representation has to be re-parsed on the far side.

export const SEP = "\u0001";
export const ROOT_PATH = "";
export const PUBLIC_SEP = ".";

export function childPath(path, key) {
  return path + SEP + key;
}

export function pathKeys(path) {
  return path === ROOT_PATH ? [] : path.slice(SEP.length).split(SEP);
}

export function pathFromKeys(keys) {
  return keys.length ? SEP + keys.join(SEP) : ROOT_PATH;
}

export function toPublicPath(path) {
  return pathKeys(path).join(PUBLIC_SEP);
}

export function fromPublicPath(publicPath) {
  const trimmed = String(publicPath ?? "").trim();
  if (!trimmed) return ROOT_PATH;
  return pathFromKeys(trimmed.split(PUBLIC_SEP));
}

export function publicPathKeys(publicPath) {
  const trimmed = String(publicPath ?? "").trim();
  return trimmed ? trimmed.split(PUBLIC_SEP) : [];
}

/** The last key of a path, or "" at the root. */
export function lastKey(path) {
  const keys = pathKeys(path);
  return keys.length ? keys[keys.length - 1] : "";
}

/** Index mapping for a list element moved from one index to another. */
export function shiftForMove(from, to) {
  return (i) => {
    if (i === from) return to;
    if (from < to) return i > from && i <= to ? i - 1 : i;
    return i >= to && i < from ? i + 1 : i;
  };
}

/** Index mapping for a removed list element. null means "drop this entry". */
export function shiftForRemove(at) {
  return (i) => (i === at ? null : i > at ? i - 1 : i);
}

/**
 * Rewrite one state key after the children of `path` were renumbered.
 * Returns null when the entry belonged to an element that no longer exists.
 */
export function reindexKey(key, path, mapIndex) {
  const prefix = path + SEP;
  if (!key.startsWith(prefix)) return key;

  const rest = key.slice(prefix.length);
  const cut = rest.indexOf(SEP);
  const head = cut === -1 ? rest : rest.slice(0, cut);
  if (!/^\d+$/.test(head)) return key;

  const next = mapIndex(Number(head));
  if (next === null) return null;
  return prefix + next + (cut === -1 ? "" : rest.slice(cut));
}
