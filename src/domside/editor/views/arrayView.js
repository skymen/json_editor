// Array nodes: indexed rows, the move and remove buttons, and the add bar.

import { make, makeButton, stopToggle } from "../dom.js";
import { buildValueRow } from "./valueView.js";
import { isContainer, fillFor, moveIn } from "../../../shared/jsonUtils.js";
import { OP } from "../../../shared/protocol.js";
import {
  SEP,
  pathKeys,
  shiftForMove,
  shiftForRemove,
} from "../../../shared/paths.js";

/**
 * The up / down / remove cluster on one element.
 *
 * `handlers` mutates the local copy and reports the op; `onChanged` rebuilds
 * the subtree, because indices below the change all shifted.
 */
export function buildReorderActions(ctx, index, count, handlers, onChanged) {
  const box = make("div", "je-actions");
  stopToggle(box);

  const act = (fn) => () => {
    fn();
    onChanged();
  };

  if (ctx.perms.reorder) {
    box.append(
      makeButton(
        "",
        "↑",
        "Move up",
        act(() => handlers.onMove(index, index - 1)),
        index === 0,
      ),
      makeButton(
        "",
        "↓",
        "Move down",
        act(() => handlers.onMove(index, index + 1)),
        index === count - 1,
      ),
    );
  }

  if (handlers.onRemove)
    box.append(
      makeButton(
        "je-del",
        "✕",
        "Remove element",
        act(() => handlers.onRemove(index)),
      ),
    );

  return box;
}

function listHandlers(ctx, list, path) {
  const keys = pathKeys(path);

  const handlers = {
    onMove: (from, to) => {
      moveIn(list, from, to);
      ctx.state.reindexChildren(path, shiftForMove(from, to));
      ctx.sendOp({ kind: OP.MOVE_ELEMENT, keys, from, to });
    },
  };

  if (ctx.perms.arrayElements)
    handlers.onRemove = (index) => {
      list.splice(index, 1);
      ctx.state.reindexChildren(path, shiftForRemove(index));
      ctx.sendOp({ kind: OP.REMOVE_ELEMENT, keys, index });
    };

  return handlers;
}

function buildAddBar(ctx, list, path, onChanged) {
  const bar = make("div", "je-addbar");

  const add = (label, title, makeValue) =>
    makeButton("je-add", label, title, () => {
      const value = makeValue();
      list.push(value);
      ctx.sendOp({ kind: OP.ADD_ELEMENT, keys: pathKeys(path), value });
      onChanged();
    });

  bar.append(add("+", "Add a number or text element", () => fillFor(list)));
  if (ctx.addButtons.object)
    bar.append(add("+{ }", "Add a nested object element", () => ({})));
  if (ctx.addButtons.array)
    bar.append(add("+[ ]", "Add a nested array element", () => []));

  return bar;
}

export function fillListHead(ctx, head, node, list, path) {
  const badge = make("span", "je-badge", `[${list.length}]`);

  node._jeOnStructureChange = () => {
    badge.textContent = `[${list.length}]`;
    ctx.rebuildNodeChildren(node, list, path);
  };

  head.append(badge);
}

export function fillListChildren(ctx, children, list, path) {
  const onChanged = () => ctx.refreshSubtree(children);
  const handlers = listHandlers(ctx, list, path);
  const showActions = ctx.perms.reorder || ctx.perms.arrayElements;

  if (!list.length) children.append(make("div", "je-message", "(no elements)"));

  for (let i = 0; i < list.length; ++i) {
    const value = list[i];
    const childPath = path + SEP + i;
    const actions = showActions
      ? buildReorderActions(ctx, i, list.length, handlers, onChanged)
      : null;

    const wrapper = ctx.buildWrapperNode(list, i, childPath, {
      labelText: String(i),
      actions,
    });
    if (wrapper) {
      children.append(wrapper);
      continue;
    }

    if (isContainer(value))
      children.append(
        ctx.buildContainerNode(value, childPath, {
          labelText: String(i),
          actions,
        }),
      );
    else
      children.append(
        buildValueRow(ctx, list, i, childPath, { isIndex: true, actions }),
      );
  }

  if (ctx.perms.arrayElements)
    children.append(buildAddBar(ctx, list, path, onChanged));
}
