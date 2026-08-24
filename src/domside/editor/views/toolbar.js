// The sticky header: a tab bar with an optional close button, and a toolbar
// with the key filter and Collapse all.

import { make, makeButton } from "../dom.js";

export function buildTabBar(ctx) {
  const bar = make("div", "je-bar je-tabbar");
  const tabs = make("div", "je-tabs");

  const buttons = new Map();
  for (const id of ctx.tabs.ids) {
    const label = ctx.tabs.labelOf(id);
    const btn = makeButton("je-tab", label, `Edit ${label}`, () =>
      ctx.selectTab(id),
    );
    btn.classList.toggle("je-on", id === ctx.tabs.activeId);
    buttons.set(id, btn);
    tabs.append(btn);
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
