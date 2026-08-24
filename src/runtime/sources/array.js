// The Array plugin, projected into the c2array wrapper so the grid view, the
// size inputs and the z plane bar all work on it unchanged. Cells are numbers
// and strings only, which is all an Array can hold.

import { emptyC2Array, c2Dimensions } from "../../shared/c2formats.js";

function dimensions(inst) {
  if (typeof inst.getSize === "function") {
    const size = inst.getSize();
    if (Array.isArray(size) && size.length === 3) return size.map(Number);
  }

  const { width, height, depth } = inst;
  if (typeof width === "number") return [width, height ?? 1, depth ?? 1];

  return null;
}

export const arraySource = {
  kind: "array",

  matches(inst) {
    return (
      !!inst &&
      typeof inst.getAt === "function" &&
      typeof inst.setAt === "function" &&
      dimensions(inst) !== null
    );
  },

  read(inst) {
    const size = dimensions(inst);
    if (!size) return null;

    const [w, h, d] = size;
    const wrapper = emptyC2Array();
    wrapper.size = [w, h, d];

    for (let x = 0; x < w; ++x) {
      const plane = [];
      for (let y = 0; y < h; ++y) {
        const row = [];
        for (let z = 0; z < d; ++z) row.push(inst.getAt(x, y, z));
        plane.push(row);
      }
      wrapper.data.push(plane);
    }

    return wrapper;
  },

  write(inst, doc) {
    if (!doc || !Array.isArray(doc.data)) return;

    const [w, h, d] = c2Dimensions(doc);
    const current = dimensions(inst);

    if (
      typeof inst.setSize === "function" &&
      (!current || current[0] !== w || current[1] !== h || current[2] !== d)
    )
      inst.setSize(w, h, d);

    for (let x = 0; x < w; ++x)
      for (let y = 0; y < h; ++y)
        for (let z = 0; z < d; ++z) {
          const value = doc.data[x]?.[y]?.[z] ?? 0;
          if (inst.getAt(x, y, z) !== value) inst.setAt(x, y, z, value);
        }
  },
};
