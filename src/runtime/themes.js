// Getting theme CSS to the DOM side.
//
// The built-in themes are compiled into the DOM bundle, so the runtime only
// ever names one. A custom theme is a .css file in the project's Files folder,
// which only the runtime can reach, so it is fetched here and the text is what
// crosses the boundary.

export const BUILT_IN_THEMES = ["construct-dark", "construct-light", "bare"];

export function isBuiltInTheme(name) {
  return BUILT_IN_THEMES.includes(name);
}

/**
 * Read a project file as text. `fetchText` is the documented route; the URL
 * fallback covers releases that do not have it.
 */
export async function fetchProjectText(runtime, filename) {
  if (!filename) return null;

  const assets = runtime?.assets;
  if (!assets) return null;

  try {
    if (typeof assets.fetchText === "function")
      return await assets.fetchText(filename);

    const url = await assets.getProjectFileUrl(filename);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (e) {
    console.error(`[JSON Editor] could not load CSS file "${filename}":`, e);
    return null;
  }
}
