// c2array nodes: the size inputs in the head, and a grid of cells below.
//
// Paths point at the real structure, so a cell lives at
// <array path>.data.<x>.<y>.<z>. That keeps what triggers report honest and
// lets a cell edit travel as an ordinary set-value op.

import { make, makeButton, stopToggle, selectAllOnFocus } from "../dom.js";
import { buildValueField } from "./valueView.js";
import { buildReorderActions } from "./arrayView.js";
import {
  c2Dimensions,
  resizeC2Array,
  removeC2Column,
} from "../../../shared/c2formats.js";
import { OP } from "../../../shared/protocol.js";
import { SEP, pathKeys, shiftForMove, shiftForRemove } from "../../../shared/paths.js";
import { moveIn } from "../../../shared/jsonUtils.js";

const DIM_TITLES = ["Width (X)", "Height (Y)", "Depth (Z)"];

export function fillC2ArrayHead(ctx, head, node, arr, path, setOpen) {
  const keys = pathKeys(path);

  // Badge on the left, then everything that acts on the array collected on the
  // right: the size inputs sit next to the add button rather than between the
  // name and it.
  head.append(make("span", "je-badge", "c2array"), make("span", "je-spacer"));

  const rebuildOnly = () => ctx.rebuildNodeChildren(node, arr, path);
  node._jeOnStructureChange = rebuildOnly;

  if (ctx.detect.c2ArrayDims) {
    const dims = make("span", "je-dims");
    stopToggle(dims);

    const dimInputs = [];
    for (let i = 0; i < 3; ++i) {
      if (i > 0) dims.append(document.createTextNode("×"));
      const input = make("input", "je-dim");
      input.type = "number";
      input.min = i === 0 ? "0" : "1";
      input.step = "1";
      input.title = DIM_TITLES[i];
      input.disabled = !ctx.perms.resizeC2Array;
      if (!input.disabled) selectAllOnFocus(input);
      dims.append(input);
      dimInputs.push(input);
    }

    const syncDims = () => {
      const size = c2Dimensions(arr);
      for (let i = 0; i < 3; ++i) dimInputs[i].value = String(size[i]);
    };
    syncDims();

    const rebuild = () => {
      syncDims();
      rebuildOnly();
    };
    node._jeOnStructureChange = rebuild;

    if (ctx.perms.resizeC2Array) {
      for (let i = 0; i < 3; ++i) {
        dimInputs[i].addEventListener("change", () => {
          const raw = dimInputs[i].value.trim();
          const n = Number(raw);
          if (!raw || !Number.isFinite(n)) {
            syncDims();
            return;
          }

          const size = c2Dimensions(arr);
          size[i] = n;
          if (resizeC2Array(arr, size[0], size[1], size[2]))
            ctx.sendOp({
              kind: OP.C2_RESIZE,
              keys,
              w: size[0],
              h: size[1],
              d: size[2],
            });
          setOpen(true);
          rebuild();
        });
      }
    }

    head.append(dims);
  }

  if (ctx.perms.resizeC2Array) {
    const addBtn = makeButton("je-add", "+", "Add element", () => {
      const [w, h, d] = c2Dimensions(arr);
      resizeC2Array(arr, w + 1, h, d);
      ctx.sendOp({ kind: OP.C2_ADD_COLUMN, keys });
      setOpen(true);
      node._jeOnStructureChange();
    });
    stopToggle(addBtn);
    head.append(addBtn);
  }
}

function buildZBar(ctx, path, d, z, children) {
  const bar = make("div", "je-zbar");

  const input = make("input", "je-dim");
  input.type = "number";
  input.min = "0";
  input.max = String(d - 1);
  input.step = "1";
  input.value = String(z);
  selectAllOnFocus(input);
  input.addEventListener("change", () => {
    const next = Math.min(
      d - 1,
      Math.max(0, Math.floor(Number(input.value)) || 0),
    );
    input.value = String(next);
    ctx.state.zSlice.set(path, next);
    ctx.refreshSubtree(children);
  });

  bar.append(make("span", "", "z plane"), input, make("span", "", `of ${d}`));
  return bar;
}

export function fillC2ArrayChildren(ctx, children, arr, path) {
  const keys = pathKeys(path);

  // Ragged data would misalign the grid, so square it off first. Only report
  // it when something actually moved.
  const [w0, h0, d0] = c2Dimensions(arr);
  if (resizeC2Array(arr, w0, h0, d0))
    ctx.sendOp({ kind: OP.C2_RESIZE, keys, w: w0, h: h0, d: d0 });

  const [w, h, d] = c2Dimensions(arr);

  let z = ctx.state.zSlice.get(path) ?? 0;
  if (z >= d || z < 0) {
    z = 0;
    ctx.state.zSlice.set(path, 0);
  }

  if (d > 1 && ctx.detect.c2ArrayZBar)
    children.append(buildZBar(ctx, path, d, z, children));

  if (w === 0) {
    children.append(make("div", "je-message", "(no elements)"));
    return;
  }

  const grid = make("div", "je-grid");
  grid.style.gridTemplateColumns = `auto 1fr repeat(${h}, minmax(2.5em, var(--je-input-w))) var(--je-actions-w)`;

  if (h > 1) {
    grid.append(make("span"), make("span"));
    for (let y = 0; y < h; ++y)
      grid.append(make("span", "je-col-label", String(y)));
    grid.append(make("span"));
  }

  const onChanged = () => ctx.refreshSubtree(children);
  const showActions = ctx.perms.reorder || ctx.perms.resizeC2Array;
  const handlers = {
    onMove: (from, to) => {
      moveIn(arr["data"], from, to);
      ctx.state.reindexChildren(path + SEP + "data", shiftForMove(from, to));
      ctx.sendOp({ kind: OP.MOVE_ELEMENT, keys: [...keys, "data"], from, to });
    },
  };
  if (ctx.perms.resizeC2Array)
    handlers.onRemove = (index) => {
      removeC2Column(arr, index);
      ctx.state.reindexChildren(path + SEP + "data", shiftForRemove(index));
      ctx.sendOp({ kind: OP.C2_REMOVE_COLUMN, keys, index });
    };

  const dataPath = path + SEP + "data";
  for (let x = 0; x < w; ++x) {
    grid.append(make("span", "je-idx", String(x)), make("span", "je-spacer"));
    for (let y = 0; y < h; ++y)
      grid.append(
        buildValueField(
          ctx,
          arr["data"][x][y],
          z,
          `${dataPath}${SEP}${x}${SEP}${y}${SEP}${z}`,
          { scalarsOnly: true },
        ),
      );
    grid.append(
      showActions
        ? buildReorderActions(ctx, x, w, handlers, onChanged)
        : make("div", "je-actions"),
    );
  }

  children.append(grid);
}
