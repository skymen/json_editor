// The editor UI. Owns the shadow root, the working copy of each tab's
// document, and the render pipeline. Knows nothing about Construct: it is
// handed configuration and documents, and reports ops and events back through
// the two callbacks it was constructed with.

import { StyleLayers } from "./styles.js";
import { TabSet } from "./state.js";
import { computeFilter, keyMatches } from "./filter.js";
import { captureFocus, restoreFocus, findFieldByPath } from "./focus.js";
import { make } from "./dom.js";
import { buildTabBar, buildToolbar } from "./views/toolbar.js";
import { fillObjectChildren } from "./views/objectView.js";
import { fillListHead, fillListChildren } from "./views/arrayView.js";
import {
  fillC2ArrayHead,
  fillC2ArrayChildren,
} from "./views/c2arrayView.js";
import { fillC2DictHead, fillC2DictChildren } from "./views/c2dictView.js";
import { isContainer, formatValue } from "../../shared/jsonUtils.js";
import { detectC2Wrapper, C2_ARRAY, C2_DICT } from "../../shared/c2formats.js";
import { defaultConfig, OP, EVENT, COMMAND } from "../../shared/protocol.js";
import { SEP, ROOT_PATH, pathFromKeys, toPublicPath } from "../../shared/paths.js";

const CONTROL_SELECTOR = "input, textarea, button, select";
const VIEW_STATE_DEBOUNCE_MS = 500;
const FLASH_MS = 1200;
const BLOCKED_KEY_EVENTS = ["keydown", "keyup", "keypress"];
// The same list Construct's own form controls block, so input never reaches
// the Mouse, Touch or Keyboard objects.
const BLOCKED_POINTER_EVENTS = [
  "pointerdown",
  "pointerrawupdate",
  "pointerup",
  "mousedown",
  "mouseup",
  "click",
];

export class Editor {
  constructor(host, { onOp, onEvent }) {
    this._host = host;
    this._onOp = onOp;
    this._onEvent = onEvent;

    this._config = defaultConfig();
    this._shadow = host.attachShadow({ mode: "open" });
    this._styles = new StyleLayers(this._shadow);

    this.tabs = new TabSet();
    this._docs = new Map();
    this._serialized = new Map();
    this._wrappers = new Map();

    this._root = null;
    this.body = null;
    this._search = null;
    this._tabButtons = new Map();

    this.filter = null;
    this._query = "";

    this._pending = [];
    this._pendingTimer = 0;

    this._pressing = false;
    this._pressedAt = 0;
    this._updateQueued = false;

    this._viewStateTimer = 0;
    this._lastViewState = "";

    this._flashTimer = 0;
    this._flashed = null;
    this._fixedPerms = null;

    // Window level, so a release outside the element still counts. It also
    // self-detaches once the host is gone, which covers a teardown that never
    // reached destroy().
    this._onWindowPointerUp = () => {
      if (!this._host.isConnected) {
        this.destroy();
        return;
      }
      this._endPress();
    };

    this._buildShell();
    this._applyTuning();
    this._renderHeader();
    this._render();
  }

  // ------------------------------------------------------------- lifecycle

  destroy() {
    this.flushPending();
    clearTimeout(this._pendingTimer);
    clearTimeout(this._viewStateTimer);
    clearTimeout(this._flashTimer);
    for (const type of ["pointerup", "pointercancel"])
      window.removeEventListener(type, this._onWindowPointerUp, true);
  }

  _buildShell() {
    const shadow = this._shadow;

    // Attached inside the root, not on the host: events retarget at the shadow
    // boundary, so a handler on the host cannot tell which control was hit.
    for (const type of BLOCKED_KEY_EVENTS)
      shadow.addEventListener(type, (e) => {
        if (this.tuning.blockInput) e.stopPropagation();
      });

    for (const type of BLOCKED_POINTER_EVENTS)
      shadow.addEventListener(type, (e) => {
        if (!this.tuning.blockInput) return;
        if (e.target.closest?.(CONTROL_SELECTOR)) e.stopPropagation();
      });

    // A rebuild in the middle of a click would pull the button out from under
    // the pointer, so refreshes are held until the press ends. Capture phase,
    // so this runs before the blocking handlers above can stop the event.
    shadow.addEventListener(
      "pointerdown",
      () => {
        this._pressing = true;
        this._pressedAt = Date.now();
      },
      true,
    );
    for (const type of ["pointerup", "pointercancel"])
      window.addEventListener(type, this._onWindowPointerUp, true);

    shadow.addEventListener("contextmenu", (e) => {
      if (this.tuning.blockInput) e.preventDefault();
    });

    this._root = make("div", "je");
    this.body = make("div", "je-body");
    this._header = make("div", "je-header");
    this._root.append(this._header, this.body);
    shadow.append(this._root);
  }

  _endPress() {
    if (!this._pressing) return;
    this._pressing = false;
    if (!this._updateQueued) return;
    this._updateQueued = false;
    setTimeout(() => this._update(), 0);
  }

  // ------------------------------------------------------ inbound: config

  setConfig(config) {
    this._config = { ...this._config, ...config };
    this._applyTuning();
    this._renderHeader();
    this._render();
  }

  _applyTuning() {
    this._root.style.setProperty("--je-scale", String(this.tuning.uiScale));
    this._root.classList.toggle(
      "je-cursor-override",
      !!this.tuning.overrideCursor,
    );
  }

  /** Swap to a built-in theme, dropping any CSS added on top of it. */
  setTheme(name) {
    this._styles.setTheme(name);
  }

  /** Apply project CSS, either on top of the theme or in place of it. */
  applyCss(css, mode) {
    this._styles.applyCss(css, mode);
  }

  /**
   * The permissions in force for the tab being shown.
   *
   * A tab whose source has a fixed shape - the global variables projection -
   * gets every structural flag masked off, however the editor is configured.
   * Adding a key there would be silently dropped on write, so the add bars,
   * remove buttons and editable key names are simply not built.
   */
  get perms() {
    const base = this._config.permissions;
    if (this.tabs.isStructural()) return base;

    if (this._fixedPerms?.from !== base) {
      this._fixedPerms = {
        from: base,
        perms: {
          ...base,
          objectKeys: false,
          renameKeys: false,
          arrayElements: false,
          reorder: false,
          resizeC2Array: false,
        },
      };
    }
    return this._fixedPerms.perms;
  }

  get detect() {
    return this._config.detect;
  }

  get chrome() {
    return this._config.chrome;
  }

  get tuning() {
    return this._config.tuning;
  }

  /** Which of the optional add buttons the add bars should offer. */
  get addButtons() {
    const mode = this.perms.addButtons;
    return {
      object: mode === "value-object-array",
      array: mode !== "value",
    };
  }

  get state() {
    return this.tabs.state();
  }

  // -------------------------------------------------------- inbound: data

  setTabs(tabs, activeId) {
    const changed = this.tabs.sync(tabs, activeId);

    for (const id of this._docs.keys())
      if (!this.tabs.has(id)) {
        this._docs.delete(id);
        this._serialized.delete(id);
      }

    if (changed) this.flushPending();
    this._renderHeader();
    this._render();
  }

  setData(tabId, doc, serialized) {
    const previous = this._serialized.get(tabId);
    if (previous !== undefined && previous === serialized) return;

    this._docs.set(tabId, doc);
    this._serialized.set(tabId, serialized);

    if (tabId !== this.tabs.activeId) return;
    this._update();
  }

  /**
   * Re-render for freshly arrived data, holding the caret and the in-progress
   * text in place.
   */
  _update() {
    if (this._pressing) {
      if (Date.now() - this._pressedAt < this.tuning.pressFreeze) {
        this._updateQueued = true;
        return;
      }
      this._pressing = false;
    }

    const focus = captureFocus(this._shadow, this.body);
    this._render();
    const kept = restoreFocus(this.body, focus);

    // A field that lost its place cannot have its half-typed edit committed.
    if (!kept || !focus.path) this._dropPending();
  }

  // ------------------------------------------------------- outbound: ops

  /**
   * Fold every string-form c2 wrapper edited this render back into the working
   * copy. The wrapper the views mutate is a parsed copy, so without this the
   * local document would still hold the stale string.
   */
  _syncWrappers() {
    for (const { container, key, wrapper } of this._wrappers.values()) {
      try {
        container[key] = JSON.stringify(wrapper);
      } catch (e) {
        console.error("[JSON Editor] could not re-serialise a wrapper:", e);
      }
    }
  }

  /** Queue a value edit, coalescing repeated typing into the same field. */
  queueValue(keys, value) {
    this._syncWrappers();

    const op = { kind: OP.SET_VALUE, keys, value };
    const last = this._pending[this._pending.length - 1];
    if (
      last &&
      last.kind === OP.SET_VALUE &&
      last.keys.length === keys.length &&
      last.keys.every((k, i) => k === keys[i])
    )
      this._pending[this._pending.length - 1] = op;
    else this._pending.push(op);

    if (this._pendingTimer) return;
    this._pendingTimer = setTimeout(() => {
      this._pendingTimer = 0;
      this.flushPending();
    }, this.tuning.commitDebounce);
  }

  /** Send a structural edit straight away, after anything already queued. */
  sendOp(op) {
    this._syncWrappers();
    this.flushPending();
    this._markLocal();
    this._emitOp(op);
  }

  flushPending() {
    clearTimeout(this._pendingTimer);
    this._pendingTimer = 0;
    if (!this._pending.length) return;

    const ops = this._pending;
    this._pending = [];
    this._markLocal();
    for (const op of ops) this._emitOp(op);
  }

  _emitOp(op) {
    this._onOp({ ...op, tabId: this.tabs.activeId });
  }

  _dropPending() {
    clearTimeout(this._pendingTimer);
    this._pendingTimer = 0;
    this._pending = [];
  }

  /**
   * Our own edit is about to come back as new data. Forgetting the snapshot
   * makes sure that echo is accepted rather than skipped as unchanged, which
   * matters when the source coerced or rejected what was sent.
   */
  _markLocal() {
    this._serialized.delete(this.tabs.activeId);
  }

  /**
   * The runtime keeps a copy of the view state so a savegame can hold it.
   * Reported on a delay and only when it actually changed, because a render
   * happens far more often than the state behind it moves.
   */
  _reportViewState() {
    clearTimeout(this._viewStateTimer);
    clearTimeout(this._flashTimer);
    this._viewStateTimer = setTimeout(() => {
      this._viewStateTimer = 0;
      this._saveViewState();

      const payload = this.viewState();
      const serialized = JSON.stringify(payload);
      if (serialized === this._lastViewState) return;
      this._lastViewState = serialized;

      this._onEvent(EVENT.VIEW_STATE, payload);
    }, VIEW_STATE_DEBOUNCE_MS);
  }

  viewState() {
    const tabs = {};
    for (const id of this.tabs.ids) {
      const state = this.tabs.state(id);
      if (!state) continue;
      tabs[id] = {
        expanded: [...state.expanded],
        zSlice: [...state.zSlice],
        query: state.query,
        scrollTop: state.scrollTop,
      };
    }
    return { tabs, active: this.tabs.activeId };
  }

  restoreViewState(payload) {
    if (!payload?.tabs) return;

    for (const [id, saved] of Object.entries(payload.tabs)) {
      const state = this.tabs.state(id);
      if (!state) continue;
      state.expanded = new Set(saved.expanded ?? []);
      state.zSlice = new Map(saved.zSlice ?? []);
      state.query = saved.query ?? "";
      state.scrollTop = saved.scrollTop ?? 0;
    }

    if (payload.active && this.tabs.has(payload.active))
      this.tabs.select(payload.active);

    this._syncTabButtons();
    if (this._search) this._search.value = this.state?.query ?? "";
    this._render();
    this._host.scrollTop = this.state?.scrollTop ?? 0;
  }

  notifyFocus(path) {
    this._onEvent(EVENT.FOCUS, { path: toPublicPath(path) });
  }

  notifyBlur(path) {
    this._onEvent(EVENT.BLUR, { path: toPublicPath(path) });
  }

  close() {
    this.flushPending();
    this._onEvent(EVENT.CLOSE, {});
  }

  selectTab(id) {
    if (!this.tabs.has(id) || id === this.tabs.activeId) return;
    this._saveViewState();
    this.flushPending();
    this.tabs.select(id);
    this._syncTabButtons();
    if (this._search) this._search.value = this.state?.query ?? "";
    this._render();
    this._host.scrollTop = this.state?.scrollTop ?? 0;
    this._onEvent(EVENT.TAB_SELECTED, { tabId: id });
  }

  // ----------------------------------------------------------- commands

  applyCommand(name, payload = {}) {
    switch (name) {
      case COMMAND.COLLAPSE_ALL:
        this.collapseAll();
        break;
      case COMMAND.EXPAND_ALL:
        this._expandAll();
        break;
      case COMMAND.EXPAND_PATH:
        this._expandAncestors(pathFromKeys(payload.keys ?? []), true);
        this._render();
        break;
      case COMMAND.COLLAPSE_PATH:
        this.state?.expanded.delete(pathFromKeys(payload.keys ?? []));
        this._render();
        break;
      case COMMAND.SCROLL_TO_PATH:
        this._scrollToPath(pathFromKeys(payload.keys ?? []));
        break;
      case COMMAND.SET_FILTER:
        if (this._search) this._search.value = payload.text ?? "";
        this._render();
        break;
      case COMMAND.SELECT_TAB:
        this.selectTab(payload.tabId);
        break;
      case COMMAND.FLUSH:
        this.flushPending();
        break;
      case COMMAND.RESTORE_VIEW:
        this.restoreViewState(payload);
        break;
      default:
        break;
    }
  }

  collapseAll() {
    const state = this.state;
    if (state) {
      state.expanded.clear();
      state.query = "";
    }
    if (this._search) this._search.value = "";
    this._render();
    this._host.scrollTop = 0;
  }

  _expandAll() {
    const state = this.state;
    if (!state) return;

    const walk = (value, path) => {
      if (!isContainer(value)) return;
      state.expanded.add(path);
      const wrapper = detectC2Wrapper(value, this.detect);
      if (wrapper) return;
      const entries = Array.isArray(value)
        ? value.map((v, i) => [i, v])
        : Object.entries(value);
      for (const [key, child] of entries) walk(child, path + SEP + key);
    };

    walk(this._activeDoc(), ROOT_PATH);
    this._render();
  }

  _expandAncestors(path, includeSelf) {
    const state = this.state;
    if (!state) return;

    const parts = path === ROOT_PATH ? [] : path.slice(SEP.length).split(SEP);
    state.expanded.add(ROOT_PATH);
    let current = ROOT_PATH;
    for (let i = 0; i < parts.length; ++i) {
      current += SEP + parts[i];
      if (i < parts.length - 1 || includeSelf) state.expanded.add(current);
    }
  }

  _scrollToPath(path) {
    this._expandAncestors(path, true);
    this._render();

    const field = findFieldByPath(this.body, path);
    const target =
      field ??
      [...this.body.querySelectorAll(".je-node")].find(
        (n) => n._jePath === path,
      );
    if (!target) return;

    // Optional: not every environment implements scrollIntoView, and the
    // flash is worth doing even where the scroll cannot happen.
    target.scrollIntoView?.({ block: "center" });
    this._flash(target);
  }

  /**
   * Light an element up briefly. Arriving somewhere in a large tree says
   * nothing about where you landed, so the destination announces itself.
   */
  _flash(el) {
    clearTimeout(this._flashTimer);
    this._flashed?.classList.remove("je-flash");

    // Reading offsetWidth restarts the animation if the same element is
    // targeted twice in a row; without it the class is already there and
    // nothing happens.
    el.classList.remove("je-flash");
    void el.offsetWidth;
    el.classList.add("je-flash");

    this._flashed = el;
    this._flashTimer = setTimeout(() => {
      el.classList.remove("je-flash");
      this._flashed = null;
      this._flashTimer = 0;
    }, FLASH_MS);
  }

  onFilterInput() {
    this._render();
  }

  expand(path) {
    this.state?.expanded.add(path);
  }

  // ------------------------------------------------------------- render

  _activeDoc() {
    return this._docs.get(this.tabs.activeId) ?? null;
  }

  _saveViewState() {
    const state = this.state;
    if (!state) return;
    state.query = this._search?.value ?? "";
    state.scrollTop = this._host.scrollTop;
  }

  isHit(key) {
    return !!this._query && keyMatches(key, this._query);
  }

  shouldOpen(path) {
    const state = this.state;
    if (!state) return false;
    if (state.expanded.has(path)) return true;
    if (!this.filter) return false;
    if (path === ROOT_PATH) return true;
    // A node whose own name matched stays shut, so a hit reads as one line
    // rather than dumping its whole subtree.
    return this.filter.visible.has(path) && !this.filter.matched.has(path);
  }

  _renderHeader() {
    const parts = [];

    const showTabs =
      this.chrome.tabBar === "always" ||
      (this.chrome.tabBar === "auto" && this.tabs.size > 1);

    if (showTabs || this.chrome.close) {
      const { bar, buttons } = buildTabBar(this, showTabs);
      this._tabButtons = buttons;
      parts.push(bar);
    } else {
      this._tabButtons = new Map();
    }

    const previousQuery = this._search?.value ?? this.state?.query ?? "";
    const { bar, search } = buildToolbar(this);
    search.value = previousQuery;
    this._search = search;
    parts.push(bar);

    this._header.replaceChildren(...parts);
    this._header.hidden = parts.every((p) => p.hidden);
  }

  _syncTabButtons() {
    for (const [id, btn] of this._tabButtons)
      btn.classList.toggle("je-on", id === this.tabs.activeId);
  }

  _render() {
    const scrollTop = this._host.scrollTop;

    this._syncWrappers();
    this._wrappers.clear();

    this._query = (this._search?.value ?? "").trim().toLowerCase();
    const data = this._activeDoc();

    this.filter =
      this._query && isContainer(data)
        ? computeFilter(data, this._query, this.detect)
        : null;

    const state = this.state;
    if (!state) {
      this.body.replaceChildren(
        make("div", "je-message", "No source bound to this editor."),
      );
      this._reportViewState();
      return;
    }

    if (isContainer(data)) {
      this.body.replaceChildren(this._buildRoot(data));
    } else if (data === null || data === undefined) {
      this.body.replaceChildren(
        make("div", "je-message", "No data to show for this tab."),
      );
    } else {
      this.body.replaceChildren(
        make(
          "div",
          "je-message",
          "Root value is not an object: " + formatValue(data),
        ),
      );
    }

    this._host.scrollTop = scrollTop;
    this._reportViewState();
  }

  /**
   * The document root has no row of its own.
   *
   * A collapsible "{ }" at the top read as an empty object sitting alongside
   * the real keys, so an object or array root renders its children straight
   * into the body. A c2 wrapper root keeps a head, because that row carries
   * the size inputs and the add button, but it gets no caret and never closes.
   */
  _buildRoot(data) {
    const wrapper = detectC2Wrapper(data, this.detect);
    if (wrapper)
      return this.buildContainerNode(wrapper.wrapper, ROOT_PATH, {
        wrapperKind: wrapper.kind,
        isRoot: true,
      });

    return this.buildChildren(data, ROOT_PATH, null);
  }

  // --------------------------------------------------------- node builders

  /**
   * Build the node for container[key] when the value is a c2 wrapper, or
   * return null so the caller falls back to the ordinary object, array or
   * value views.
   */
  buildWrapperNode(container, key, path, opts = {}) {
    const descriptor = detectC2Wrapper(container[key], this.detect);
    if (!descriptor) return null;

    // A wrapper stored as a string is edited through a parsed copy, so the
    // copy has to be registered for folding back in.
    if (descriptor.fromString)
      this._wrappers.set(path, { container, key, wrapper: descriptor.wrapper });

    return this._buildWrapperFor(descriptor, path, {
      labelText: String(key),
      ...opts,
    });
  }

  _buildWrapperFor(descriptor, path, opts) {
    return this.buildContainerNode(descriptor.wrapper, path, {
      ...opts,
      wrapperKind: descriptor.kind,
    });
  }

  buildContainerNode(value, path, opts = {}) {
    const { label, labelText, actions, wrapperKind = null, isRoot = false } = opts;

    const node = make("div", isRoot ? "je-node je-root je-open" : "je-node");
    node._jePath = path;
    node._jeWrapperKind = wrapperKind;
    const head = make("div", "je-head");

    if (!isRoot) {
      let labelNode = label;
      if (!labelNode) {
        const text = labelText ?? "";
        labelNode = make("span", "je-key", text);
        labelNode.title = text;
        if (this.isHit(text)) labelNode.classList.add("je-hit");
      }
      head.append(make("span", "je-caret", "▶"), labelNode);
    }
    node.append(head);

    const setOpen = (open, record = true) => {
      if (isRoot) return;

      if (record) {
        if (open) this.state.expanded.add(path);
        else this.state.expanded.delete(path);
      }

      node.classList.toggle("je-open", open);

      let children = node.querySelector(":scope > .je-children");
      if (open && !children) {
        children = this.buildChildren(value, path, wrapperKind);
        node.append(children);
      }
      if (children) children.hidden = !open;
    };

    if (wrapperKind === C2_ARRAY)
      fillC2ArrayHead(this, head, node, value, path, setOpen);
    else if (wrapperKind === C2_DICT)
      fillC2DictHead(this, head, node, value, path);
    else if (Array.isArray(value)) fillListHead(this, head, node, value, path);
    else head.append(this._buildBadge(value));

    if (actions) {
      if (!head.querySelector(".je-spacer"))
        head.append(make("span", "je-spacer"));
      head.append(actions);
    }

    if (isRoot) {
      node.append(this.buildChildren(value, path, wrapperKind));
      return node;
    }

    head.addEventListener("click", () =>
      setOpen(!node.classList.contains("je-open")),
    );

    if (this.shouldOpen(path)) setOpen(true, this.state.expanded.has(path));

    return node;
  }

  _buildBadge(value) {
    return make(
      "span",
      "je-badge",
      Array.isArray(value)
        ? `[${value.length}]`
        : `{${Object.keys(value).length}}`,
    );
  }

  buildChildren(value, path, wrapperKind) {
    const children = make("div", "je-children");

    if (wrapperKind === C2_ARRAY) fillC2ArrayChildren(this, children, value, path);
    else if (wrapperKind === C2_DICT)
      fillC2DictChildren(this, children, value, path);
    else if (Array.isArray(value)) fillListChildren(this, children, value, path);
    else fillObjectChildren(this, children, value, path);

    return children;
  }

  rebuildNodeChildren(node, value, path) {
    const wrapperKind = node._jeWrapperKind ?? null;
    const old = node.querySelector(":scope > .je-children");
    const fresh = this.buildChildren(value, path, wrapperKind);
    fresh.hidden = !node.classList.contains("je-open");
    if (old) old.replaceWith(fresh);
    else node.append(fresh);
  }

  /** Rebuild the smallest subtree that covers a structural change. */
  refreshSubtree(el) {
    const node = el.closest(".je-node");
    if (node?._jeOnStructureChange) node._jeOnStructureChange();
    else this._render();
  }

  requestRender() {
    this._render();
  }
}
