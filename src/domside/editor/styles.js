// Style layers inside the shadow root.
//
//   layout   structure. Always applied, never replaced by anything.
//   theme    colour and border. A built-in theme, or CSS that replaced it.
//   custom   CSS stacked on top of the theme.
//
// Three ways in, and that is the whole surface:
//
//   setTheme(name)          built-in theme, custom layer cleared
//   applyCss(css, append)   stacked on top of whatever is there
//   applyCss(css, replace)  becomes the theme, custom layer cleared
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

export class StyleLayers {
  constructor(root) {
    this._layout = document.createElement("style");
    this._theme = document.createElement("style");
    this._custom = document.createElement("style");

    this._layout.textContent = layoutCss;
    this._theme.textContent = builtInThemeCss(DEFAULT_THEME);

    // Order is the cascade: layout, then theme, then anything added on top.
    root.append(this._layout, this._theme, this._custom);
  }

  /** Switch to a built-in theme, dropping any CSS added on top of it. */
  setTheme(name) {
    this._theme.textContent = builtInThemeCss(name);
    this._custom.textContent = "";
  }

  /**
   * Apply CSS supplied by the project.
   *
   * "append" stacks it on the current theme, so a stylesheet only has to
   * override the --je-* variables it cares about, and several can be layered.
   * "replace" makes it the theme, so nothing but the layout layer remains.
   */
  applyCss(css, mode) {
    const text = css ?? "";

    if (mode === "replace") {
      this._theme.textContent = text;
      this._custom.textContent = "";
      return;
    }

    this._custom.textContent = this._custom.textContent
      ? `${this._custom.textContent}\n${text}`
      : text;
  }
}
