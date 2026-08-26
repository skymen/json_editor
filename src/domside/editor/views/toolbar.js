// The sticky header: a tab bar with an optional close button, a toolbar with
// the key filter and Collapse all, and the action button bars underneath.

import { make, makeButton } from "../dom.js";
import { actionKind } from "../../../shared/actionButtons.js";
import { isActionDisabled } from "../actions.js";

/**
 * The tab bar row. `showTabs` decides whether the tab buttons themselves are
 * built: the row can still be needed for the close button alone, and in that
 * case it must not smuggle a single pointless tab button back in.
 */
export function buildTabBar(ctx, showTabs) {
  const bar = make("div", "je-bar je-tabbar");
  const tabs = make("div", "je-tabs");

  const buttons = new Map();
  if (showTabs) {
    for (const id of ctx.tabs.ids) {
      const label = ctx.tabs.labelOf(id);
      const btn = makeButton("je-tab", label, `Edit ${label}`, () =>
        ctx.selectTab(id),
      );
      btn.classList.toggle("je-on", id === ctx.tabs.activeId);
      buttons.set(id, btn);
      tabs.append(btn);
    }
  }

  bar.append(tabs);
  if (ctx.chrome.close)
    bar.append(
      makeButton("je-close", "×", "Close the editor", () => ctx.close()),
    );

  return { bar, buttons };
}

export function buildToolbar(ctx) {
  const bar = make("div", "je-bar");

  const search = make("input", "je-search");
  search.type = "search";
  search.placeholder = "Filter keys…";
  search.spellcheck = false;
  search.value = ctx.state?.query ?? "";
  search.addEventListener("input", () => ctx.onFilterInput());
  search.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    search.value = "";
    ctx.onFilterInput();
    e.preventDefault();
  });
  search.hidden = !ctx.chrome.filter;

  bar.append(search);

  if (ctx.chrome.collapseAll)
    bar.append(
      makeButton(
        "",
        "Collapse all",
        "Clear the filter and close everything, down to the outer braces",
        () => ctx.collapseAll(),
      ),
    );

  bar.hidden = !ctx.chrome.filter && !ctx.chrome.collapseAll;
  return { bar, search };
}

/**
 * A row of custom action buttons.
 *
 * Used twice: once for the buttons that belong to every tab, and once for the
 * ones scoped to whichever tab is open. Both act on the open tab, so a button
 * whose kind cannot do anything to that tab's source is shown disabled rather
 * than quietly doing nothing.
 */
export function buildActionBar(ctx, actions, extraClass = "") {
  const bar = make("div", `je-bar je-actionbar${extraClass}`);

  const buttons = new Map();
  for (const action of actions) {
    const btn = makeButton(
      "je-action",
      action.label,
      actionKind(action.kind).title,
      () => ctx.runAction(action),
      isActionDisabled(ctx, action),
    );
    buttons.set(action.id, btn);
    bar.append(btn);
  }

  bar.hidden = !actions.length;
  return { bar, buttons };
}
