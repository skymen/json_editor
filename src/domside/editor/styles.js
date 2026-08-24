// Style layers inside the shadow root.
//
//   layout   structure. Always applied, never replaced.
//   theme    colour and border. Swapped by name, by project file, or by
//            a string pushed from an action.
//   append   extra rules stacked on top of whichever theme is active, so a
//            built-in theme can be tweaked instead of rewritten.
//
// Plain <style> nodes rather than adoptedStyleSheets: constructable
// stylesheets only reached Safari in 16.4, and swapping textContent costs
// nothing here.

import layoutCss from "../../css/layout.css?raw";
import themeBaseCss from "../../css/theme.base.css?raw";
import constructDarkCss from "../../css/theme.construct-dark.css?raw";
import constructLightCss from "../../css/theme.construct-light.css?raw";
import bareCss from "../../css/theme.bare.css?raw";

// A built-in theme is the descriptive base plus its variable block. "bare"
// deliberately skips the base too, leaving layout on its own.
const BUILT_IN_THEMES = {
  "construct-dark": themeBaseCss + constructDarkCss,
  "construct-light": themeBaseCss + constructLightCss,
  bare: bareCss,
};

export const DEFAULT_THEME = "construct-dark";

export function builtInThemeCss(name) {
  return BUILT_IN_THEMES[name] ?? BUILT_IN_THEMES[DEFAULT_THEME];
}

export function isBuiltInTheme(name) {
  return Object.prototype.hasOwnProperty.call(BUILT_IN_THEMES, name);
}

export class StyleLayers {
  constructor(root) {
    this._layout = document.createElement("style");
    this._theme = document.createElement("style");
    this._append = document.createElement("style");

    this._layout.textContent = layoutCss;
    this._theme.textContent = builtInThemeCss(DEFAULT_THEME);

    // Order is the cascade: layout, then theme, then user additions.
    root.append(this._layout, this._theme, this._append);
  }

  /** Replace the theme layer with one of the built-ins. */
  setTheme(name) {
    this._theme.textContent = builtInThemeCss(name);
  }

  /** Replace the theme layer with arbitrary CSS. */
  setThemeCss(css) {
    this._theme.textContent = css ?? "";
  }

  /** Stack rules on top of the current theme. */
  setAppendedCss(css) {
    this._append.textContent = css ?? "";
  }

  clearAppendedCss() {
    this._append.textContent = "";
  }
}
