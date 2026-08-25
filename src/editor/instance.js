const SDK = globalThis.SDK;

const DEFAULT_SIZE = [400, 300];
const ROWS = 5;

/**
 * The layout view cannot render the real editor, which is a DOM element, so it
 * gets a simple stand-in: a panel, a bar with the selected tab, and a few
 * rows. The colours are the Construct dark theme's own, taken from the same
 * grey ramp steps theme.construct-dark.css uses, so the placeholder and the
 * running editor agree about what the thing looks like.
 */
const PANEL = rgb(0x57, 0x57, 0x57); // gray11, dialog body
const BAR = rgb(0x5e, 0x5e, 0x5e); // gray12, dialog caption
const OUTLINE = rgb(0x17, 0x17, 0x17);
const ACCENT = rgb(0x29, 0xf3, 0xd0); // the selected tab
const ROW = rgb(0xb8, 0xb8, 0xb8); // gray23, body text
const FIELD = rgb(0x38, 0x38, 0x38); // gray7, input

function rgb(r, g, b) {
  return [r / 255, g / 255, b / 255];
}

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

      fill(iRenderer, PANEL, x, y, w, h);
      iRenderer.SetColorRgba(OUTLINE[0], OUTLINE[1], OUTLINE[2], 1);
      iRenderer.LineQuad(quad);

      if (w < 24 || h < 24) return;

      const pad = Math.max(2, Math.min(w, h) / 30);
      const barH = Math.min(h * 0.16, pad * 3);

      // Bar, with the selected tab in the accent colour.
      fill(iRenderer, BAR, x, y, w, barH);
      fill(iRenderer, ACCENT, x + pad, y, Math.min(w * 0.28, pad * 8), barH * 0.8);

      // A few key rows, each with a value field on the right.
      const rowH = Math.min((h - barH - pad * 2) / ROWS, pad * 2.6);
      const valueW = Math.min(w * 0.36, pad * 12);

      for (let i = 0; i < ROWS; ++i) {
        const rowY = y + barH + pad + i * rowH;
        if (rowY + rowH * 0.6 > y + h - pad) break;

        const indent = pad + (i % 2) * pad * 1.6;
        fill(iRenderer, ROW, x + indent, rowY, w * 0.22, rowH * 0.4);
        fill(iRenderer, FIELD, x + w - valueW - pad, rowY, valueW, rowH * 0.55);
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
