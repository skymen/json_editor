import { id, addonType, properties } from "../../config.caw.js";
import AddonTypeMap from "../../template/addonTypeMap.js";
import { SyncEngine } from "./sync.js";
import { fetchProjectText, isBuiltInTheme } from "./themes.js";
import {
  MSG,
  EVENT,
  COMMAND,
  OP_TRIGGER,
  STYLE_LAYER,
  defaultConfig,
} from "../shared/protocol.js";
import { publicPathKeys } from "../shared/paths.js";

// Property values arrive as a flat array in declaration order, groups
// included, so the ids are resolved to positions once rather than counted by
// hand every time the list changes.
const PROP = {};
properties.forEach((prop, index) => {
  PROP[prop.id] = index;
});

const DEFAULT_TAB = "main";

export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();

      this._config = defaultConfig();
      this._tabs = [];
      this._activeTab = DEFAULT_TAB;

      this._theme = "construct-dark";
      this._customCssFile = "";
      this._customCssMode = "append";
      this._themeCss = null;
      this._appendedCss = "";

      this._closeBehaviour = "trigger";
      this._autoRefresh = true;
      this._refreshInterval = 200;

      this._lastPath = "";
      this._lastKey = "";
      this._lastValue = "";
      this._lastOldValue = "";
      this._lastTabId = "";
      this._filterText = "";
      this._viewState = null;

      let elementId = "";
      let className = "";
      let styleAttribute = "";

      const props = this._getInitProperties();
      if (props) {
        this._readProperties(props);
        elementId = props[PROP["elem-id"]];
        className = props[PROP["elem-class"]];
        styleAttribute = props[PROP["style-attribute"]];
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
        editValues: props[PROP["allow-edit-values"]],
        objectKeys: props[PROP["allow-object-keys"]],
        renameKeys: props[PROP["allow-rename-keys"]],
        arrayElements: props[PROP["allow-array-elements"]],
        reorder: props[PROP["allow-reorder"]],
        resizeC2Array: props[PROP["allow-resize-c2array"]],
        addButtons: props[PROP["add-buttons"]],
      };

      config.detect = {
        c2array: props[PROP["detect-c2array"]],
        c2arrayString: props[PROP["detect-c2array-string"]],
        c2dictionary: props[PROP["detect-c2dictionary"]],
        c2dictionaryString: props[PROP["detect-c2dictionary-string"]],
        c2ArrayDims: props[PROP["show-c2array-dims"]],
        c2ArrayZBar: props[PROP["show-c2array-zbar"]],
      };

      config.chrome = {
        tabBar: props[PROP["tab-bar"]],
        filter: props[PROP["show-filter"]],
        collapseAll: props[PROP["show-collapse-all"]],
        close: props[PROP["show-close"]],
      };

      config.tuning = {
        uiScale: props[PROP["ui-scale"]],
        longValueChars: props[PROP["long-value-chars"]],
        commitDebounce: props[PROP["commit-debounce"]],
        pressFreeze: props[PROP["press-freeze"]],
        blockInput: props[PROP["block-input"]],
        overrideCursor: props[PROP["override-cursor"]],
      };

      this._theme = props[PROP["theme"]];
      this._customCssFile = props[PROP["custom-css"]] ?? "";
      this._customCssMode = props[PROP["custom-css-mode"]];
      this._closeBehaviour = props[PROP["close-behaviour"]];
      this._autoRefresh = props[PROP["auto-refresh"]];
      this._refreshInterval = props[PROP["refresh-interval"]];

      // The property-driven binding is the first tab. Actions can add more.
      this._tabs = [
        {
          id: DEFAULT_TAB,
          label: "Data",
          kind: props[PROP["source-kind"]],
          uid: -1,
          objectName: props[PROP["source-object"]]?.name ?? "",
        },
      ];
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
        return { layer: STYLE_LAYER.THEME, css: this._themeCss };
      return { layer: STYLE_LAYER.THEME, theme: this._theme };
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

    _onClose() {
      this._trigger("OnCloseClicked");

      if (this._closeBehaviour === "destroy") this.destroy();
      else if (this._closeBehaviour === "hide") this.isVisible = false;
    }

    // ----------------------------------------------------------------- tabs

    _tabById(tabId) {
      return this._tabs.find((t) => t.id === tabId) ?? null;
    }

    _instanceFor(tab) {
      if (!tab || tab.kind === "globals") return null;

      if (tab.uid > 0) {
        const inst = this.runtime.getInstanceByUid(tab.uid);
        if (inst) return inst;
      }

      if (!tab.objectName) return null;
      const objectClass = this.runtime.objects[tab.objectName];
      return objectClass ? objectClass.getFirstInstance() : null;
    }

    _postTabs() {
      this._postToDOMElement(MSG.TABS, {
        tabs: this._tabs.map((t) => ({ id: t.id, label: t.label })),
        activeId: this._activeTab,
      });
    }

    // ------------------------------------------------- source, exposed to ACEs

    setSourceObject(objectParam, tabId = this._activeTab) {
      const tab = this._tabById(tabId);
      if (!tab) return;

      Object.assign(tab, describeObject(objectParam));
      this._sync.invalidate(tab.id);
      this._sync.poll();
    }

    setSourceUID(uid, tabId = this._activeTab) {
      const tab = this._tabById(tabId);
      if (!tab) return;

      tab.uid = Number(uid) || -1;
      tab.objectName = "";
      this._sync.invalidate(tab.id);
      this._sync.poll();
    }

    setSourceKind(kind, tabId = this._activeTab) {
      const tab = this._tabById(tabId);
      if (!tab) return;

      tab.kind = kind;
      this._sync.invalidate(tab.id);
      this._sync.poll();
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

    addTab(tabId, label, kind, objectParam) {
      if (!tabId) return;

      const existing = this._tabById(tabId);
      const tab = existing ?? { id: tabId };
      tab.label = label || tabId;
      tab.kind = kind || "auto";
      Object.assign(tab, describeObject(objectParam));

      if (!existing) this._tabs.push(tab);
      this._postTabs();
      this._sync.invalidate(tabId);
      this._sync.poll();
    }

    removeTab(tabId) {
      const index = this._tabs.findIndex((t) => t.id === tabId);
      if (index === -1) return;

      this._tabs.splice(index, 1);
      this._sync.forget(tabId);
      if (this._activeTab === tabId)
        this._activeTab = this._tabs[0]?.id ?? DEFAULT_TAB;
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

    // ---------------------------------------------- appearance, exposed to ACEs

    setTheme(name) {
      if (!isBuiltInTheme(name)) return;
      this._theme = name;
      this._themeCss = null;
      this._pushStyle({ layer: STYLE_LAYER.THEME, theme: name });
    }

    setThemeCss(css) {
      this._themeCss = String(css ?? "");
      this._pushStyle({ layer: STYLE_LAYER.THEME, css: this._themeCss });
    }

    /**
     * Load a CSS file from the project's Files folder.
     *
     * "append" stacks it on the current theme, so a file only has to override
     * the --je-* variables it cares about. "replace" drops the theme layer
     * entirely, for a stylesheet that describes everything itself. Layout is
     * applied first either way and is never affected.
     */
    async loadCssFile(filename, mode = this._customCssMode) {
      const css = await fetchProjectText(this.runtime, filename);
      if (css === null) return;

      this._customCssFile = filename;
      if (mode === "replace") this.setThemeCss(css);
      else this.appendCss(css);
    }

    appendCss(css) {
      this._appendedCss = String(css ?? "");
      this._pushStyle({ layer: STYLE_LAYER.APPEND, css: this._appendedCss });
    }

    clearAppendedCss() {
      this.appendCss("");
    }

    async _loadCustomCssFromProperty() {
      if (!this._customCssFile) return;
      await this.loadCssFile(this._customCssFile, this._customCssMode);
    }

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
      this._config.permissions.addButtons = mode;
      this._pushConfig();
    }

    setDetect(name, on) {
      if (!(name in this._config.detect)) return;
      this._config.detect[name] = !!on;
      this._sync.invalidate();
      this._pushConfig();
    }

    setChrome(name, value) {
      if (!(name in this._config.chrome)) return;
      this._config.chrome[name] = value;
      this._pushConfig();
    }

    setCloseBehaviour(mode) {
      this._closeBehaviour = mode;
    }

    // ---------------------------------------------- navigation, exposed to ACEs

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
            { name: "Tabs", value: this._tabs.map((t) => t.id).join(", ") },
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
        appendedCss: this._appendedCss,
        viewState: this._viewState,
      };
    }

    _loadFromJson(o) {
      this._tabs = Array.isArray(o["tabs"]) ? o["tabs"] : this._tabs;
      this._activeTab = o["activeTab"] ?? DEFAULT_TAB;
      this._theme = o["theme"] ?? this._theme;
      this._themeCss = o["themeCss"] ?? null;
      this._appendedCss = o["appendedCss"] ?? "";
      this._viewState = o["viewState"] ?? null;

      this._postTabs();
      this._pushStyle(this._styleState());
      if (this._appendedCss)
        this._pushStyle({ layer: STYLE_LAYER.APPEND, css: this._appendedCss });

      this._sync.invalidate();
      this._sync.poll();

      // After the data, so the tabs the state belongs to already exist.
      if (this._viewState) this._command(COMMAND.RESTORE_VIEW, this._viewState);
    }
  };
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

  const objectName = objectParam.name ?? "";

  let inst = null;
  if (typeof objectParam.getFirstPickedInstance === "function")
    inst = objectParam.getFirstPickedInstance();
  if (!inst && typeof objectParam.getFirstInstance === "function")
    inst = objectParam.getFirstInstance();

  if (!inst && typeof objectParam.uid === "number")
    return { uid: objectParam.uid, objectName };

  return { uid: inst?.uid ?? -1, objectName };
}
