// Source registry. A tab names a kind; this maps that name to the adapter that
// knows how to read and write it.
//
// Every adapter is (instance, runtime) in, whole document out. That is a
// deliberately coarse interface: it keeps the sync loop and the op applier
// from knowing anything about Construct's plugins, and it leaves room for an
// adapter to grow a finer-grained write later without anything else changing.

import { jsonSource } from "./jsonObject.js";
import { dictionarySource } from "./dictionary.js";
import { arraySource } from "./array.js";
import { globalsSource } from "./globals.js";

export const SOURCES = {
  [jsonSource.kind]: jsonSource,
  [dictionarySource.kind]: dictionarySource,
  [arraySource.kind]: arraySource,
  [globalsSource.kind]: globalsSource,
};

/** Order matters: the most specific test comes first. */
const AUTO_ORDER = [jsonSource, arraySource, dictionarySource];

export function sourceFor(kind) {
  return SOURCES[kind] ?? null;
}

/** Work out which adapter suits an instance, for kind "auto". */
export function detectSource(inst) {
  if (!inst) return null;
  for (const source of AUTO_ORDER) if (source.matches(inst)) return source;
  return null;
}

export function readSource(kind, inst, runtime) {
  const source = kind === "auto" ? detectSource(inst) : sourceFor(kind);
  if (!source) return null;
  if (source !== globalsSource && !inst) return null;

  try {
    return source.read(inst, runtime);
  } catch (e) {
    console.error("[JSON Editor] could not read the source:", e);
    return null;
  }
}

export function writeSource(kind, inst, doc, runtime) {
  const source = kind === "auto" ? detectSource(inst) : sourceFor(kind);
  if (!source) return;
  if (source !== globalsSource && !inst) return;

  try {
    source.write(inst, doc, runtime);
  } catch (e) {
    console.error("[JSON Editor] could not write the source:", e);
  }
}
