// c2dictionary nodes: one flat level of scalar rows, which is the whole of
// what the format can express. No nesting, no reordering.
//
// Keys can still be added, removed and renamed when those permissions are on,
// since a dictionary's key set is not fixed the way a c2array's shape is.

import { make, makeButton, stopToggle } from "../dom.js";
import { buildValueField } from "./valueView.js";
import { buildKeyLabel } from "./objectView.js";
import { fillFor } from "../../../shared/jsonUtils.js";
import { OP } from "../../../shared/protocol.js";
import { SEP, pathKeys } from "../../../shared/paths.js";

const NEW_KEY = "newKey";

function uniqueKey(data) {
  if (!(NEW_KEY in data)) return NEW_KEY;
  for (let i = 2; ; ++i) {
    const candidate = `${NEW_KEY}${i}`;
    if (!(candidate in data)) return candidate;
  }
}

export function c2DictBadge(dict) {
  return `dict {${Object.keys(dict["data"]).length}}`;
}

export function fillC2DictHead(ctx, head, node, dict, path) {
  const badge = make("span", "je-badge", c2DictBadge(dict));

  node._jeOnStructureChange = () => {
    badge.textContent = c2DictBadge(dict);
    ctx.rebuildNodeChildren(node, dict, path);
  };

  head.append(badge);
}

export function fillC2DictChildren(ctx, children, dict, path) {
  const data = dict["data"];
  const dataPath = path + SEP + "data";
  const keys = Object.keys(data);

  if (!keys.length) children.append(make("div", "je-message", "(empty)"));

  for (const key of keys) {
    const childPath = dataPath + SEP + key;
    const row = make("div", "je-row");
    const label = buildKeyLabel(ctx, data, key, childPath);

    // scalarsOnly: a c2dictionary holds numbers and strings, nothing else.
    const field = buildValueField(ctx, data, key, childPath, {
      scalarsOnly: true,
    });
    if (field.tagName === "TEXTAREA") row.classList.add("je-block");

    let actions;
    if (ctx.perms.objectKeys) {
      actions = make("div", "je-actions");
      stopToggle(actions);
      actions.append(
        makeButton("je-del", "✕", `Remove "${key}"`, () => {
          delete data[key];
          ctx.sendOp({
            kind: OP.REMOVE_KEY,
            keys: pathKeys(dataPath),
            key,
          });
          ctx.refreshSubtree(children);
        }),
      );
    } else {
      actions = make("div", "je-actions");
    }

    row.append(label, make("span", "je-spacer"), field, actions);
    children.append(row);
  }

  if (ctx.perms.objectKeys) {
    const bar = make("div", "je-addbar");
    bar.append(
      makeButton("je-add", "+", "Add a key", () => {
        const key = uniqueKey(data);
        const value = fillFor(Object.values(data));
        data[key] = value;
        ctx.sendOp({
          kind: OP.ADD_KEY,
          keys: pathKeys(dataPath),
          key,
          value,
        });
        ctx.refreshSubtree(children);
      }),
    );
    children.append(bar);
  }
}
