// Value inspection, formatting and parsing. Nothing in here knows about
// Construct, the DOM or the message protocol, so both sides of the boundary can
// import it freely.

export function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function isContainer(v) {
  return v !== null && typeof v === "object";
}

export function isScalar(v) {
  return !isContainer(v);
}

export function formatValue(v) {
  return JSON.stringify(v);
}

/** What kind of value a field is showing, used for syntax colouring. */
export function typeClass(v) {
  if (typeof v === "number") return "je-t-number";
  if (typeof v === "string") return "je-t-string";
  return "je-t-keyword";
}

/**
 * Parse what the user typed into a value field.
 *
 * `scalarsOnly` is for the places that physically cannot hold anything else:
 * c2array cells, c2dictionary values, and Dictionary or Array bindings. Plain
 * JSON accepts booleans and null too, written as the bare keywords.
 */
export function parseValue(text, scalarsOnly = false) {
  const trimmed = text.trim();
  if (!trimmed)
    return { ok: false, error: 'Empty, use "" for an empty string' };

  let value;
  try {
    value = JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      error: 'Not a valid JSON value, text must be quoted, e.g. "hello"',
    };
  }

  if (isContainer(value))
    return { ok: false, error: "Objects and arrays can't be typed in here" };

  if (scalarsOnly && typeof value !== "number" && typeof value !== "string")
    return { ok: false, error: "Must be a number or a quoted string" };

  return { ok: true, value };
}

/**
 * Pick the default value for a new entry by looking at what its siblings hold.
 * A list of strings gets "", anything else gets 0.
 */
export function fillFor(values) {
  for (const v of values) {
    if (typeof v === "string") return "";
    if (typeof v === "number") return 0;
  }
  return 0;
}

/** Coerce `next` to the type `current` already has. Used for global variables. */
export function coerceLike(current, next) {
  if (isContainer(next)) return current;

  if (typeof current === "number") {
    const n = Number(next);
    return Number.isFinite(n) ? n : current;
  }
  if (typeof current === "boolean") return !!next;
  return next === null || next === undefined ? "" : String(next);
}

export function moveIn(list, from, to) {
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
}
