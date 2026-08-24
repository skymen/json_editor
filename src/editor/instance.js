const SDK = globalThis.SDK;

const DEFAULT_SIZE = [400, 300];

/**
 * The layout view cannot render the real editor, which is a DOM element, so it
 * gets a drawing of one instead. The colours are the Construct dark theme's,
 * taken from the same grey ramp theme.construct-dark.css uses, so the
 * placeholder and the running editor agree about what the thing looks like.
 */
const C = {
  panel: rgb(0x57, 0x57, 0x57), // gray11, dialog body
  bar: rgb(0x5e, 0x5e, 0x5e), // gray12, dialog caption
  outline: rgb(0x17, 0x17, 0x17),
  field: rgb(0x38, 0x38, 0x38), // gray7, dialog input
  line: rgb(0x70, 0x70, 0x70), // gray14
  text: rgb(0xb8, 0xb8, 0xb8), // gray23
  dim: rgb(0x8f, 0x8f, 0x8f), // gray18
  tabIdle: rgb(0xa9, 0xa9, 0xa9), // gray30 at the 0.45 the theme fades it to
  tabOn: rgb(0x29, 0xf3, 0xd0), // the accent
  number: rgb(0x2f, 0xcc, 0x63),
  string: rgb(0xdd, 0xf9, 0x2b),
  keyword: rgb(0xb5, 0x6b, 0xff),
};

function rgb(r, g, b) {
  return [r / 255, g / 255, b / 255];
}

// One row of the drawn tree: how deep it is indented, and which colour its
// value field takes. null means a container row, which has no value.
const ROWS = [
  [0, C.number],
  [0, null],
  [1, C.string],
  [1, C.number],
  [1, null],
  [2, C.keyword],
  [2, C.string],
  [0, C.string],
];

export default function (instanceClass) {
  return class extends instanceClass {
    constructor(sdkType, inst) {
      super(sdkType, inst);
    }

    Release() {
      super.Release();
    }

    OnCreate() {
      this._inst.SetOrigin(0, 0);
    }

    OnPlacedInLayout() {
      this._inst.SetSize(...DEFAULT_SIZE);
    }

    Draw(iRenderer) {
      this._inst.ApplyBlendMode(iRenderer);
      iRenderer.SetColorFillMode();

      const quad = this._inst.GetQuad();
      const x = quad.getTlx();
      const y = quad.getTly();
      const w = this._inst.GetWidth();
      const h = this._inst.GetHeight();
      if (w < 24 || h < 24) {
        fill(iRenderer, C.panel, x, y, w, h);
        return;
      }

      // Everything is proportional to the instance so the drawing keeps its
      // shape as the object is resized, but clamped so it stays readable when
      // the object is small.
      const u = Math.max(2, Math.min(w, h) / 44);
      const pad = u * 1.2;

      fill(iRenderer, C.panel, x, y, w, h);
      outline(iRenderer, C.outline, quad);

      // Tab bar, with the active tab in the accent colour.
      const barH = Math.min(u * 3.4, h * 0.14);
      fill(iRenderer, C.bar, x, y, w, barH);
      const tabW = Math.min(w * 0.26, u * 13);
      fill(iRenderer, C.tabOn, x + pad, y, tabW, barH * 0.86);
      fill(iRenderer, C.tabIdle, x + pad * 2 + tabW, y, tabW, barH * 0.86);

      // Toolbar: the search pill and the Collapse all button.
      const toolY = y + barH;
      const toolH = Math.min(u * 3.2, h * 0.13);
      fill(iRenderer, C.bar, x, toolY, w, toolH);
      const btnW = Math.min(w * 0.22, u * 11);
      fill(iRenderer, C.field, x + pad, toolY + toolH * 0.2,
           w - btnW - pad * 3, toolH * 0.6);
      fill(iRenderer, C.line, x + w - btnW - pad, toolY + toolH * 0.2,
           btnW, toolH * 0.6);

      // The tree.
      const bodyY = toolY + toolH + pad;
      const rowH = u * 2.6;
      const valueW = Math.min(w * 0.34, u * 17);

      for (let i = 0; i < ROWS.length; ++i) {
        const [depth, valueColor] = ROWS[i];
        const rowY = bodyY + i * rowH;
        if (rowY + rowH * 0.7 > y + h - pad) break;

        const indent = pad + depth * u * 2.2;

        // The guide line down the left of a nested block.
        if (depth > 0) {
          fill(iRenderer, C.line, x + indent - u * 0.9, rowY - rowH * 0.15,
               Math.max(1, u * 0.14), rowH);
        }

        // Caret, then the key name.
        fill(iRenderer, C.dim, x + indent, rowY + rowH * 0.28,
             u * 0.7, u * 0.7);
        const keyW = Math.min(w * 0.3, u * (7 + ((i * 3) % 5)));
        fill(iRenderer, C.text, x + indent + u * 1.3, rowY + rowH * 0.22,
             keyW, u * 0.9);

        if (!valueColor) continue;

        // The value field, with the coloured literal inside it.
        const fieldX = x + w - valueW - pad;
        fill(iRenderer, C.field, fieldX, rowY, valueW, rowH * 0.8);
        fill(iRenderer, valueColor, fieldX + u * 0.7, rowY + rowH * 0.26,
             valueW * (0.3 + ((i * 7) % 5) / 12), u * 0.9);
      }
    }

    OnPropertyChanged(id, value) {}
  };
}

function fill(iRenderer, color, x, y, w, h) {
  if (w <= 0 || h <= 0) return;
  iRenderer.SetColorRgba(color[0], color[1], color[2], 1);
  const q = new SDK.Quad();
  q.setRect(x, y, x + w, y + h);
  iRenderer.Quad(q);
}

function outline(iRenderer, color, quad) {
  iRenderer.SetColorRgba(color[0], color[1], color[2], 1);
  iRenderer.LineQuad(quad);
}
