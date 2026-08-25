// Per-tab view state. Kept apart from the document so switching tabs never
// leaks one tree's expansion into another tree that happens to share key names.

import { reindexKey } from "../../shared/paths.js";

export class TabState {
  constructor() {
    this.expanded = new Set();
    this.zSlice = new Map();
    this.query = "";
    this.scrollTop = 0;
  }

  reset() {
    this.expanded.clear();
    this.zSlice.clear();
    this.query = "";
    this.scrollTop = 0;
  }

  /**
   * Renumber the state keys under `path` after its children moved. Entries
   * belonging to a removed element are dropped rather than left pointing at
   * whatever slid into their index.
   */
  reindexChildren(path, mapIndex) {
    const expanded = new Set();
    for (const key of this.expanded) {
      const next = reindexKey(key, path, mapIndex);
      if (next !== null) expanded.add(next);
    }
    this.expanded = expanded;

    const slices = new Map();
    for (const [key, value] of this.zSlice) {
      const next = reindexKey(key, path, mapIndex);
      if (next !== null) slices.set(next, value);
    }
    this.zSlice = slices;
  }
}

export class TabSet {
  constructor() {
    this._states = new Map();
    this._order = [];
    this._labels = new Map();
    this._structural = new Map();
    this._active = null;
  }

  get activeId() {
    return this._active;
  }

  get ids() {
    return this._order.slice();
  }

  get size() {
    return this._order.length;
  }

  labelOf(id) {
    return this._labels.get(id) ?? id;
  }

  /** Whether this tab's source can have keys added, removed or renamed. */
  isStructural(id = this._active) {
    return this._structural.get(id) !== false;
  }

  has(id) {
    return this._states.has(id);
  }

  state(id = this._active) {
    return this._states.get(id) ?? null;
  }

  add(id, label, structural = true) {
    if (!this._states.has(id)) {
      this._states.set(id, new TabState());
      this._order.push(id);
    }
    this._labels.set(id, label ?? id);
    this._structural.set(id, structural !== false);
    if (this._active === null) this._active = id;
  }

  remove(id) {
    if (!this._states.has(id)) return;
    this._states.delete(id);
    this._labels.delete(id);
    this._structural.delete(id);
    this._order = this._order.filter((x) => x !== id);
    if (this._active === id) this._active = this._order[0] ?? null;
  }

  clear() {
    this._states.clear();
    this._labels.clear();
    this._structural.clear();
    this._order = [];
    this._active = null;
  }

  select(id) {
    if (!this._states.has(id) || id === this._active) return false;
    this._active = id;
    return true;
  }

  /**
   * Bring the set in line with the tab list the runtime sent, keeping the
   * state of tabs that survived. Returns true if the active tab changed.
   */
  sync(tabs, activeId) {
    const wanted = new Set(tabs.map((t) => t.id));
    for (const id of this._order.slice())
      if (!wanted.has(id)) this.remove(id);

    for (const tab of tabs) this.add(tab.id, tab.label, tab.structural);
    this._order = tabs.map((t) => t.id);

    const before = this._active;
    if (activeId && this._states.has(activeId)) this._active = activeId;
    else if (!this._states.has(this._active)) this._active = this._order[0] ?? null;

    return before !== this._active;
  }
}
