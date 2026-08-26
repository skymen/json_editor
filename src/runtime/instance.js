import { id, addonType, properties } from "../../config.caw.js";
import AddonTypeMap from "../../template/addonTypeMap.js";
import { SyncEngine } from "./sync.js";
import { fetchProjectText } from "./themes.js";
import {
  MSG,
  EVENT,
  COMMAND,
  OP_TRIGGER,
  STYLE_MODE,
  defaultConfig,
} from "../shared/protocol.js";
import { publicPathKeys } from "../shared/paths.js";
import { detectSource } from "./sources/index.js";
import {
  ACTION_KIND_IDS,
  ACTION_CLEAR,
  ACTION_IMPORT,
  actionKind,
  emptyDocFor,
} from "../shared/actionButtons.js";
import {
  fromCombo,
  ADD_BUTTON_MODES,
  THEMES,
  CSS_MODES,
  TAB_BAR_MODES,
  CLOSE_BEHAVIOURS,
} from "../shared/combos.js";

const ALL_IDS = properties.map((prop) => prop.id);
const VALUE_IDS = properties
  .filter((prop) => prop.type !== "group")
  .map((prop) => prop.id);

/**
 * Property values arrive as a flat array, and whether group headers take a slot
 * in it is not something the addon can safely assume. The length says which it
 * is, so the values are keyed by id here and every read below is by name.
 */
function propsById(values) {
  const ids = values.length === ALL_IDS.length ? ALL_IDS : VALUE_IDS;
  const out = {};
  ids.forEach((propId, index) => {
    out[propId] = values[index];
  });
  return out;
}

const DEFAULT_TAB = "main";

// A tab reads either a bound object or the project's global variables. Which
// adapter an object needs is worked out from what the instance supports, so the
// only distinction a tab has to carry is this one.
const AUTO = "auto";
const GLOBALS = "globals";

export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();

      this._config = defaultConfig();
      this._tabs = [];
      this._activeTab = DEFAULT_TAB;

      this._theme = THEMES[0];
      this._themeCss = null;
      this._customCss = "";
      this._customCssFile = "";
      this._customCssMode = CSS_MODES[0];

      this._closeBehaviour = CLOSE_BEHAVIOURS[0];
      this._autoRefresh = true;
      this._refreshInterval = 200;

      this._lastPath = "";
      this._lastKey = "";
      this._lastValue = "";
      this._lastOldValue = "";
      this._lastTabId = "";
      this._lastActionId = "";
      this._filterText = "";
      this._viewState = null;

      let elementId = "";
      let className = "";
      let styleAttribute = "";

      const values = this._getInitProperties();
      if (values) {
        const props = propsById(values);
        this._readProperties(props);
        elementId = props["elem-id"] ?? "";
        className = props["elem-class"] ?? "";
        styleAttribute = props["style-attribute"] ?? "";
      }

      this._sync = new SyncEngine({
        getTabs: () => this._tabs,
        getInstance: (tab) => this._instanceFor(tab),
        getDetect: () => this._config.detect,
        getRuntime: () => this.runtime,
        post: (name, data) => this._postToDOMElement(name, data),
      });

      this._createElement({
        id: elementId,
        className: className,
        "style-attribute": styleAttribute,
        config: this._config,
        style: this._styleState(),
      });

      // The first read is deferred to the first tick: the runtime interface is
      // not reliably reachable from a constructor, and the element has not been
      // created on the DOM side yet either.
      this._started = false;
      this._setTicking(true);
    }

    // ------------------------------------------------------------ properties

    _readProperties(props) {
      const config = this._config;

      config.permissions = {
        editValues: !!props["allow-edit-values"],
        objectKeys: !!props["allow-object-keys"],
        renameKeys: !!props["allow-rename-keys"],
        arrayElements: !!props["allow-array-elements"],
        reorder: !!props["allow-reorder"],
        resizeC2Array: !!props["allow-resize-c2array"],
        addButtons: fromCombo(ADD_BUTTON_MODES, props["add-buttons"], "value-array"),
      };

      config.detect = {
        c2array: !!props["detect-c2array"],
        c2arrayString: !!props["detect-c2array-string"],
        c2dictionary: !!props["detect-c2dictionary"],
        c2dictionaryString: !!props["detect-c2dictionary-string"],
        c2ArrayDims: !!props["show-c2array-dims"],
        c2ArrayZBar: !!props["show-c2array-zbar"],
      };

      config.chrome = {
        tabBar: fromCombo(TAB_BAR_MODES, props["tab-bar"]),
        filter: !!props["show-filter"],
        collapseAll: !!props["show-collapse-all"],
        close: !!props["show-close"],
        // Not a property: action buttons only ever come from events. It still
        // has to be carried across, because this replaces the whole object.
        actions: config.chrome.actions ?? [],
      };

      config.tuning = {
        uiScale: Number(props["ui-scale"]) || 0.6,
        longValueChars: Number(props["long-value-chars"]) || 40,
        commitDebounce: Math.max(0, Number(props["commit-debounce"]) || 0),
        pressFreeze: Math.max(0, Number(props["press-freeze"]) || 0),
        blockInput: !!props["block-input"],
        overrideCursor: !!props["override-cursor"],
      };

      this._theme = fromCombo(THEMES, props["theme"]);
      this._customCssFile = asFilename(props["custom-css"]);
      this._customCssMode = fromCombo(CSS_MODES, props["custom-css-mode"]);
      this._closeBehaviour = fromCombo(CLOSE_BEHAVIOURS, props["close-behaviour"]);
      this._autoRefresh = !!props["auto-refresh"];
      this._refreshInterval = Math.max(0, Number(props["refresh-interval"]) || 0);

      // Only bind a tab when the properties actually name something to edit. An
      // unbound placeholder tab would show up in the tab bar and count towards
      // it, which is exactly what "hide when single" is there to avoid.
      if (props["edit-globals"]) {
        this._tabs = [makeTab(DEFAULT_TAB, "Globals", GLOBALS)];
        return;
      }

      const objectName = props["source-object"]?.name ?? "";
      if (!objectName) return;

      const tab = makeTab(DEFAULT_TAB, objectName, AUTO);
      tab.objectName = objectName;
      this._tabs = [tab];
    }

    // -------------------------------------------------------------- element

    _getElementState() {
      return {
        config: this._config,
        style: this._styleState(),
      };
    }

    _styleState() {
      if (this._themeCss !== null)
        return { mode: STYLE_MODE.REPLACE, css: this._themeCss };
      return { mode: STYLE_MODE.THEME, theme: this._theme };
    }

    _pushConfig() {
      this._postToDOMElement(MSG.CONFIG, { config: this._config });
    }

    _pushStyle(style) {
      this._postToDOMElement(MSG.STYLE, style);
    }

    _command(name, payload = {}) {
      this._postToDOMElement(MSG.COMMAND, { name, payload });
    }

    // ----------------------------------------------------------------- tick

    _tick() {
      // The base class positions the element from here, so this must run
      // whatever else happens.
      super._tick();

      if (!this._started) {
        this._started = true;
        this._postTabs();
        this._sync.poll();
        this._loadCustomCssFromProperty();
        return;
      }

      // Polling is what keeps the editor in step with changes made by events.
      // With it off the editor only re-reads when the Refresh action runs.
      if (!this._autoRefresh) return;
      this._sync.tick(Date.now(), this._refreshInterval);
    }

    // ------------------------------------------------------------- messages

    _onOpMessage(e) {
      const op = e["op"];
      if (!op) return;

      const tab = this._tabById(op["tabId"] ?? this._activeTab);
      if (!tab) return;

      const report = this._sync.applyOp(tab, op);
      if (!report) return;

      this._lastPath = report.path;
      this._lastKey = report.key;
      this._lastValue = report.value ?? "";
      this._lastOldValue = report.oldValue ?? "";
      this._lastTabId = tab.id;

      const trigger = OP_TRIGGER[op["kind"]];
      if (trigger) this._trigger(trigger);
      this._trigger("OnAnyEdit");
    }

    _onEventMessage(e) {
      const name = e["name"];
      const payload = e["payload"] ?? {};

      switch (name) {
        case EVENT.FOCUS:
          this._lastPath = payload["path"] ?? "";
          this._trigger("OnFieldFocused");
          break;

        case EVENT.BLUR:
          this._lastPath = payload["path"] ?? "";
          this._trigger("OnFieldBlurred");
          break;

        case EVENT.TAB_SELECTED:
          this._activeTab = payload["tabId"] ?? this._activeTab;
          this._lastTabId = this._activeTab;
          this._trigger("OnTabSelected");
          break;

        case EVENT.ACTION:
          this._onAction(payload);
          break;

        case EVENT.CLOSE:
          this._onClose();
          break;

        case EVENT.VIEW_STATE:
          this._viewState = payload;
          break;

        default:
          break;
      }
    }

    /**
     * A button in one of the action bars was pressed.
     *
     * Copy, Save and Import all happen on the DOM side, where the clipboard and
     * the file dialogs are; Import only comes back here to have the document it
     * read written to the source. Clear is the other way round: emptying needs
     * to know what the source is, so the DOM side only reports the press.
     */
    _onAction(payload) {
      const id = payload["id"] ?? "";
      const tab = this._tabById(payload["tabId"] ?? this._activeTab);
      const kind = payload["kind"] ?? "";

      this._lastActionId = id;
      if (tab) this._lastTabId = tab.id;

      let replaced = false;

      if (tab && kind === ACTION_IMPORT && payload["doc"] !== undefined) {
        this._sync.replaceDoc(tab, payload["doc"]);
        replaced = true;
      } else if (tab && kind === ACTION_CLEAR) {
        const doc = emptyDocFor(this._sourceKindOf(tab));
        if (doc !== null) {
          this._sync.replaceDoc(tab, doc);
          replaced = true;
        }
      }

      if (replaced) this._sync.poll();

      this._trigger("OnActionButtonClicked");
      this._trigger("OnAnyActionButtonClicked");
      if (replaced) this._trigger("OnAnyEdit");
    }

    _onClose() {
      this._trigger("OnCloseClicked");

      if (this._closeBehaviour === "destroy") this.destroy();
      else if (this._closeBehaviour === "hide") this.isVisible = false;
    }

    // ----------------------------------------------------------------- tabs

    _tabById(tabId) {
      return this._tabs.find((t) => t.id === tabId) ?? null;
    }

    /**
     * The source actions work without a tab having been set up first, so the
     * default tab is created on demand rather than sitting there empty from the
     * start.
     */
    _ensureTab(tabId) {
      const existing = this._tabById(tabId);
      if (existing) return existing;

      const tab = makeTab(tabId, tabId === DEFAULT_TAB ? "Data" : tabId, AUTO);
      this._tabs.push(tab);
      this._postTabs();
      return tab;
    }

    _instanceFor(tab) {
      if (!tab || tab.kind === GLOBALS) return null;

      if (tab.uid > 0) {
        const inst = this.runtime.getInstanceByUid(tab.uid);
        if (inst) return inst;
      }

      if (!tab.objectName) return null;
      const objectClass = this.runtime.objects[tab.objectName];
      return objectClass ? objectClass.getFirstInstance() : null;
    }

    /** What a tab's source turned out to be, once "auto" has been resolved. */
    _sourceKindOf(tab) {
      if (!tab) return "json";
      if (tab.kind === GLOBALS) return "globals";
      if (tab.kind !== AUTO) return tab.kind;
      return detectSource(this._instanceFor(tab))?.kind ?? "json";
    }

    _postTabs() {
      if (this._tabs.length && !this._tabById(this._activeTab))
        this._activeTab = this._tabs[0].id;

      this._postToDOMElement(MSG.TABS, {
        // A project's set of globals is fixed at build time: keys cannot be
        // added, removed or renamed, and the source ignores any attempt. The
        // editor is told so it can leave those controls out rather than offer
        // buttons that quietly do nothing.
        tabs: this._tabs.map((t) => ({
          id: t.id,
          label: t.label,
          structural: t.kind !== GLOBALS,
          // The kind a tab names may be "auto", but the buttons need to know
          // what it actually resolved to before they can offer to empty or
          // replace it, so it is worked out here rather than on the DOM side.
          kind: this._sourceKindOf(t),
        })),
        activeId: this._activeTab,
      });
    }

    /**
     * A tab's binding changed. Re-post the tab list as well as re-reading:
     * switching a tab to or from global variables changes whether its
     * structure can be edited, and the DOM side learns that from the list.
     */
    _rebind(tab) {
      this._postTabs();
      this._sync.invalidate(tab.id);
      this._sync.poll();
    }

    // ------------------------------------------------- source, exposed to ACEs

    setSourceObject(objectParam, tabId) {
      const tab = this._ensureTab(tabId || this._activeTab || DEFAULT_TAB);
      tab.kind = AUTO;
      Object.assign(tab, describeObject(objectParam));
      this._rebind(tab);
    }

    setSourceUID(uid, tabId) {
      const tab = this._ensureTab(tabId || this._activeTab || DEFAULT_TAB);
      tab.kind = AUTO;
      tab.uid = Number(uid) || -1;
      tab.objectName = "";
      this._rebind(tab);
    }

    setSourceToGlobals(tabId) {
      const tab = this._ensureTab(tabId || this._activeTab || DEFAULT_TAB);
      tab.kind = GLOBALS;
      tab.uid = -1;
      tab.objectName = "";
      this._rebind(tab);
    }

    refresh() {
      this._sync.invalidate();
      this._sync.poll();
    }

    setAutoRefresh(on) {
      this._autoRefresh = !!on;
    }

    setRefreshInterval(ms) {
      this._refreshInterval = Math.max(0, Number(ms) || 0);
    }

    addTab(tabId, label, objectParam) {
      this._addTab(tabId, label, AUTO, describeObject(objectParam));
    }

    addGlobalsTab(tabId, label) {
      this._addTab(tabId, label, GLOBALS, { uid: -1, objectName: "" });
    }

    _addTab(tabId, label, kind, binding) {
      if (!tabId) return;

      const existing = this._tabById(tabId);
      const tab = existing ?? makeTab(tabId, label, kind);
      tab.label = label || tabId;
      tab.kind = kind;
      Object.assign(tab, binding);

      if (!existing) this._tabs.push(tab);
      this._rebind(tab);
    }

    removeTab(tabId) {
      const index = this._tabs.findIndex((t) => t.id === tabId);
      if (index === -1) return;

      this._tabs.splice(index, 1);
      this._sync.forget(tabId);
      this._postTabs();
    }

    clearTabs() {
      for (const tab of this._tabs) this._sync.forget(tab.id);
      this._tabs = [];
      this._activeTab = DEFAULT_TAB;
      this._postTabs();
    }

    selectTab(tabId) {
      if (!this._tabById(tabId)) return;
      this._activeTab = tabId;
      this._command(COMMAND.SELECT_TAB, { tabId });
    }

    // ------------------------------------------------ theme, exposed to ACEs

    /** Switch to a built-in theme, dropping any CSS loaded on top of it. */
    setTheme(name) {
      this._theme = fromCombo(THEMES, name);
      this._themeCss = null;
      this._customCss = "";
      this._pushStyle({ mode: STYLE_MODE.THEME, theme: this._theme });
    }

    /**
     * Apply CSS supplied by the project.
     *
     * "append" stacks it on the current theme, so a stylesheet only has to
     * override the --je-* variables it cares about, and several can be layered.
     * "replace" makes it the theme, so nothing but the layout layer remains.
     */
    applyCss(css, mode) {
      const text = String(css ?? "");
      const resolved = fromCombo(CSS_MODES, mode);

      if (resolved === "replace") {
        this._themeCss = text;
        this._customCss = "";
      } else {
        this._customCss = this._customCss ? `${this._customCss}\n${text}` : text;
      }

      this._pushStyle({ mode: resolved, css: text });
    }

    async loadCssFile(filename, mode) {
      const name = asFilename(filename);
      if (!name) return;

      const css = await fetchProjectText(this.runtime, name);
      if (css === null) return;

      this._customCssFile = name;
      this.applyCss(css, mode);
    }

    async _loadCustomCssFromProperty() {
      if (!this._customCssFile) return;
      await this.loadCssFile(this._customCssFile, this._customCssMode);
    }

    // -------------------------------------------- top bar, exposed to ACEs

    setUiScale(scale) {
      this._config.tuning.uiScale = Math.max(0.05, Number(scale) || 0.05);
      this._pushConfig();
    }

    setPermission(name, on) {
      if (!(name in this._config.permissions)) return;
      this._config.permissions[name] = !!on;
      this._pushConfig();
    }

    setAddButtons(mode) {
      this._config.permissions.addButtons = fromCombo(ADD_BUTTON_MODES, mode);
      this._pushConfig();
    }

    setDetect(name, on) {
      if (!(name in this._config.detect)) return;
      this._config.detect[name] = !!on;
      this._sync.invalidate();
      this._pushConfig();
    }

    setTabBar(mode) {
      this._config.chrome.tabBar = fromCombo(TAB_BAR_MODES, mode);
      this._pushConfig();
    }

    setChrome(name, value) {
      if (!(name in this._config.chrome)) return;
      this._config.chrome[name] = value;
      this._pushConfig();
    }

    // ----------------------------------------- action buttons, exposed to ACEs

    /**
     * Add a button to one of the action bars, or reconfigure one that is
     * already there. An empty `tab` puts it on every tab; naming a tab moves it
     * to the second bar, which only shows while that tab is open.
     *
     * Save writes under the label of whichever tab is open, so there is nothing
     * to configure here: a button shown on every tab would need a name per tab
     * anyway, and the label is already the name the user sees for that data.
     */
    addActionButton(buttonId, label, kind, tab) {
      const id = String(buttonId ?? "").trim();
      if (!id) return;

      const resolved = fromCombo(ACTION_KIND_IDS, kind);
      const button = {
        id,
        label: String(label ?? "").trim() || actionKind(resolved).defaultLabel,
        kind: resolved,
        tab: String(tab ?? "").trim(),
      };

      const actions = this._config.chrome.actions;
      const at = actions.findIndex((a) => a.id === id);
      if (at === -1) actions.push(button);
      else actions[at] = button;

      this._pushConfig();
    }

    removeActionButton(buttonId) {
      const id = String(buttonId ?? "").trim();
      const actions = this._config.chrome.actions;
      const at = actions.findIndex((a) => a.id === id);
      if (at === -1) return;

      actions.splice(at, 1);
      this._pushConfig();
    }

    clearActionButtons() {
      if (!this._config.chrome.actions.length) return;
      this._config.chrome.actions = [];
      this._pushConfig();
    }

    setCloseBehaviour(mode) {
      this._closeBehaviour = fromCombo(CLOSE_BEHAVIOURS, mode);
    }

    // --------------------------------------------- navigation, exposed to ACEs

    setFilterText(text) {
      this._filterText = String(text ?? "");
      this._command(COMMAND.SET_FILTER, { text: this._filterText });
    }

    collapseAll() {
      this._filterText = "";
      this._command(COMMAND.COLLAPSE_ALL);
    }

    expandAll() {
      this._command(COMMAND.EXPAND_ALL);
    }

    expandPath(path) {
      this._command(COMMAND.EXPAND_PATH, { keys: publicPathKeys(path) });
    }

    collapsePath(path) {
      this._command(COMMAND.COLLAPSE_PATH, { keys: publicPathKeys(path) });
    }

    scrollToPath(path) {
      this._command(COMMAND.SCROLL_TO_PATH, { keys: publicPathKeys(path) });
    }

    // --------------------------------------------------------- expressions

    get lastPath() {
      return this._lastPath;
    }

    get lastKey() {
      return this._lastKey;
    }

    get lastValue() {
      return this._lastValue;
    }

    get lastOldValue() {
      return this._lastOldValue;
    }

    get lastTabId() {
      return this._lastTabId;
    }

    get lastActionId() {
      return this._lastActionId;
    }

    get currentTab() {
      return this._activeTab;
    }

    get filterText() {
      return this._filterText;
    }

    get themeName() {
      return this._themeCss !== null ? "custom" : this._theme;
    }

    // ------------------------------------------------------------- plumbing

    _trigger(method) {
      this.dispatch(method);
      super._trigger(self.C3[AddonTypeMap[addonType]][id].Cnds[method]);
    }

    on(tag, callback, options) {
      if (!this.events[tag]) this.events[tag] = [];
      this.events[tag].push({ callback, options });
    }

    off(tag, callback) {
      if (this.events[tag])
        this.events[tag] = this.events[tag].filter(
          (event) => event.callback !== callback,
        );
    }

    dispatch(tag) {
      if (!this.events[tag]) return;
      this.events[tag].forEach((event) => {
        if (event.options && event.options.params) {
          const fn = self.C3[AddonTypeMap[addonType]][id].Cnds[tag];
          if (fn && !fn.call(this, ...event.options.params)) return;
        }
        event.callback();
        if (event.options && event.options.once) this.off(tag, event.callback);
      });
    }

    _getDebuggerProperties() {
      return [
        {
          title: "JSON Editor",
          properties: [
            { name: "Current tab", value: this._activeTab },
            {
              name: "Tabs",
              value:
                this._tabs.map((t) => `${t.id}:${t.kind}`).join(", ") ||
                "(none)",
            },
            { name: "Theme", value: this.themeName },
            { name: "Last path", value: this._lastPath },
            {
              name: "Auto refresh",
              value: this._autoRefresh,
              onedit: (v) => this.setAutoRefresh(v),
            },
          ],
        },
      ];
    }

    _saveToJson() {
      return {
        tabs: this._tabs,
        activeTab: this._activeTab,
        theme: this._theme,
        themeCss: this._themeCss,
        customCss: this._customCss,
        actions: this._config.chrome.actions,
        viewState: this._viewState,
      };
    }

    _loadFromJson(o) {
      this._tabs = Array.isArray(o["tabs"]) ? o["tabs"] : this._tabs;
      this._activeTab = o["activeTab"] ?? DEFAULT_TAB;
      this._theme = o["theme"] ?? this._theme;
      this._themeCss = o["themeCss"] ?? null;
      this._customCss = o["customCss"] ?? "";
      this._config.chrome.actions = Array.isArray(o["actions"])
        ? o["actions"]
        : [];
      this._viewState = o["viewState"] ?? null;

      this._pushConfig();

      this._postTabs();

      this._pushStyle(this._styleState());
      if (this._customCss)
        this._pushStyle({ mode: STYLE_MODE.APPEND, css: this._customCss });

      this._sync.invalidate();
      this._sync.poll();

      // After the data, so the tabs the state belongs to already exist.
      if (this._viewState) this._command(COMMAND.RESTORE_VIEW, this._viewState);
    }
  };
}

function makeTab(tabId, label, kind) {
  return { id: tabId, label: label || tabId, kind, uid: -1, objectName: "" };
}

/** A project file property is only usable when it actually names a file. */
function asFilename(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Turn an object parameter into something a tab can hold on to.
 *
 * The name is kept alongside the UID so a tab bound to an object type keeps
 * working when the instance it first resolved to is destroyed and replaced.
 */
function describeObject(objectParam) {
  if (!objectParam) return { uid: -1, objectName: "" };

  if (typeof objectParam === "number")
    return { uid: objectParam, objectName: "" };

  // An instance rather than an object type.
  if (typeof objectParam.uid === "number")
    return {
      uid: objectParam.uid,
      objectName: objectParam.objectType?.name ?? "",
    };

  const objectName = objectParam.name ?? "";

  let inst = null;
  if (typeof objectParam.getFirstPickedInstance === "function")
    inst = objectParam.getFirstPickedInstance();
  if (!inst && typeof objectParam.getFirstInstance === "function")
    inst = objectParam.getFirstInstance();

  return { uid: inst?.uid ?? -1, objectName };
}
