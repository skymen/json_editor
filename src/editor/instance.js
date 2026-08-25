const SDK = globalThis.SDK;

const DEFAULT_SIZE = [400, 300];

// Construct dark, the same ramp steps theme.construct-dark.css uses.
const PANEL = [0x57 / 255, 0x57 / 255, 0x57 / 255]; // gray11, dialog body
const BAR = [0x5e / 255, 0x5e / 255, 0x5e / 255]; // gray12, dialog caption
const MARK = [0x29 / 255, 0xf3 / 255, 0xd0 / 255]; // the accent teal
const EDGE = [0x17 / 255, 0x17 / 255, 0x17 / 255]; // gray3, C3's dialog border
const EDGE_WIDTH = 1;

const BAR_HEIGHT = 0.13; // of the object height
const BAR_MAX = 22; // but never taller than this

const MARK_HEIGHT = 0.34; // of the shorter side
const BRACE_WIDTH = 0.32; // of the mark's height
const BRACE_GAP = 0.2; // ditto
const THICKNESS = 0.15; // ditto, at the stroke's widest

// The curls take about a quarter of each half, so a low sample count leaves
// only a handful of segments in them and they render as straight diagonal
// slashes. This draws once per layout repaint, so it can afford to be smooth.
const STEPS = 48;

// A brace's anatomy, as fractions of the distance from its middle point to a
// terminal: the tip curve, then a straight spine, then the terminal curling
// back towards whatever the braces enclose.
const TIP_END = 0.32;
const CURL_START = 0.78;
const SPINE = 0.55; // the spine's x, as a fraction of the full width

// A brace is not a pipe of even thickness: it swells along the spine and
// tapers to the middle point and to each terminal. Without this the terminals
// read as blunt diagonal slabs.
const TAPER = 0.26; // fraction of each half spent tapering
const THIN = 0.5; // stroke width at the very ends, of the widest

/**
 * The layout view cannot render the real editor - it is a DOM element - so the
 * object draws a bar and a { } mark instead.
 *
 * The editor renderer has no mesh call, but it does have Quad2, which takes
 * four arbitrary corners. Each brace is therefore a curve sampled into points
 * and extruded into a ribbon of quads, mitred at the joins so the strip reads
 * as one continuous stroke.
 */
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

    Draw(iRenderer, iDrawParams) {
      this._inst.ApplyBlendMode(iRenderer);
      iRenderer.SetColorFillMode();

      const quad = this._inst.GetQuad();

      iRenderer.SetColorRgba(PANEL[0], PANEL[1], PANEL[2], 1);
      iRenderer.Quad(quad);

      this._drawContents(iRenderer, quad);

      // Last, so it sits over the bar and the mark instead of being painted
      // under them, and so it is drawn even when the instance is too small for
      // anything else. C3 gives a dialog a 4px rgba(23,23,23,.7) border; this
      // is the same colour, thinner so it does not swallow a small object.
      //
      iRenderer.SetColorRgba(EDGE[0], EDGE[1], EDGE[2], 1);
      iRenderer.PushLineWidth(lineWidth(EDGE_WIDTH, iDrawParams));
      iRenderer.PushLineCap("square");
      iRenderer.LineQuad(quad);
      iRenderer.PopLineWidth();
      iRenderer.PopLineCap();
    }

    _drawContents(iRenderer, quad) {
      const x = quad.getTlx();
      const y = quad.getTly();
      const g = layout(x, y, this._inst.GetWidth(), this._inst.GetHeight());
      if (!g) return;

      iRenderer.SetColorRgba(BAR[0], BAR[1], BAR[2], 1);
      rect(iRenderer, x, y, g.w, g.barH);

      if (!g.mark) return;
      const { cx, cy, height, braceW, gap, thickness } = g.mark;

      iRenderer.SetColorRgba(MARK[0], MARK[1], MARK[2], 1);
      const emit = (...corners) => iRenderer.Quad2(...corners);
      ribbon(
        emit,
        brace(cx - gap / 2 - braceW, cy, height, braceW, 1),
        thickness,
      );
      ribbon(
        emit,
        brace(cx + gap / 2 + braceW, cy, height, braceW, -1),
        thickness,
      );
    }

    OnPropertyChanged(id, value) {}
  };
}

/**
 * A line width in layout units that comes out `px` screen pixels thick.
 *
 * The renderer builds line geometry straight from its width in whatever space
 * is current - LineQuad is quads of 0.5 * lineWidth - so a fixed width is in
 * layout units and thickens as the view zooms in. Construct compensates for
 * this itself when it sets the layout view's base width, and this is that same
 * calculation:
 *
 *   f = Math.floor(dpr) / dpr / zoom     (dpr < 1: 1 / dpr / zoom)
 *
 * Dividing by the zoom is what holds the width steady; the dpr term snaps it
 * to whole device pixels so it stays crisp on fractional-ratio displays.
 *
 * Note this uses GetZoomFactor rather than LayoutToClientDeviceX, which folds
 * in devicePixelRatio and would give device pixels, not screen pixels.
 */
export function lineWidth(px, iDrawParams) {
  const view = iDrawParams?.GetLayoutView?.();
  const reported =
    typeof view?.GetZoomFactor === "function" ? view.GetZoomFactor() : 1;
  const zoom = Number.isFinite(reported) && reported > 0 ? reported : 1;

  const dpr = globalThis.devicePixelRatio || 1;
  const snap = dpr < 1 ? 1 / dpr : Math.floor(dpr) / dpr;

  return (px * snap) / zoom;
}

/**
 * Where the bar and the mark sit inside an object of this size.
 *
 * Exported so the preview script can lay the drawing out exactly as the editor
 * does; keeping a second copy of these proportions is how the two drifted
 * apart before. Returns null when the object is too small to draw anything in,
 * and a null `mark` when only the bar fits.
 */
export function layout(x, y, w, h) {
  if (w < 12 || h < 12) return null;

  const barH = Math.min(h * BAR_HEIGHT, BAR_MAX);
  const bodyH = h - barH;
  const height = Math.min(w, bodyH) * MARK_HEIGHT;

  return {
    w,
    h,
    barH,
    mark:
      height < 6
        ? null
        : {
            cx: x + w / 2,
            cy: y + barH + bodyH / 2,
            height,
            braceW: height * BRACE_WIDTH,
            gap: height * BRACE_GAP,
            thickness: Math.max(1, height * THICKNESS),
          },
  };
}

function rect(iRenderer, x, y, w, h) {
  const q = new SDK.Quad();
  q.setRect(x, y, x + w, y + h);
  iRenderer.Quad(q);
}

function smoothstep(t) {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
}

/**
 * How far a brace stands out from its tip, `u` being the distance from the
 * middle point to a terminal as a fraction. Three parts: out to the spine,
 * along the spine, then out again into the terminal curl.
 */
function braceOffset(u, width) {
  if (u <= TIP_END) return width * SPINE * smoothstep(u / TIP_END);
  if (u >= CURL_START) {
    const t = (u - CURL_START) / (1 - CURL_START);
    return width * (SPINE + (1 - SPINE) * smoothstep(t));
  }
  return width * SPINE;
}

/** The stroke's width at `u`, as a fraction of its widest. */
function braceWeight(u) {
  const fromTip = smoothstep(u / TAPER);
  const fromEnd = smoothstep((1 - u) / TAPER);
  return THIN + (1 - THIN) * Math.min(fromTip, fromEnd);
}

/**
 * One brace as a centreline, each point carrying the stroke weight there.
 *
 * `tipX` is where the middle point sits and `sign` says which way the arms
 * open, so the same function draws both halves of the pair.
 */
export function brace(tipX, cy, height, width, sign) {
  const points = [];
  for (let i = 0; i <= STEPS; ++i) {
    const s = -1 + (2 * i) / STEPS;
    const u = Math.abs(s);
    points.push([
      tipX + sign * braceOffset(u, width),
      cy + (s * height) / 2,
      braceWeight(u),
    ]);
  }
  return points;
}

/**
 * Extrude a centreline into a strip of quads, following the per-point weight.
 *
 * Takes an emit callback rather than the renderer so the geometry can be
 * checked on its own, away from Construct.
 */
export function ribbon(emit, points, thickness) {
  const half = thickness / 2;

  // A vertex normal averaged from its neighbours mitres the joins; per-segment
  // normals would leave a notch on the outside of every bend.
  const normals = points.map((_, i) => {
    const [px, py] = points[Math.max(0, i - 1)];
    const [nx, ny] = points[Math.min(points.length - 1, i + 1)];
    const dx = nx - px;
    const dy = ny - py;
    const len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len];
  });

  for (let i = 0; i < points.length - 1; ++i) {
    const [x1, y1, w1] = points[i];
    const [x2, y2, w2] = points[i + 1];
    const [n1x, n1y] = normals[i];
    const [n2x, n2y] = normals[i + 1];
    const h1 = half * w1;
    const h2 = half * w2;

    emit(
      x1 + n1x * h1,
      y1 + n1y * h1,
      x2 + n2x * h2,
      y2 + n2y * h2,
      x2 - n2x * h2,
      y2 - n2y * h2,
      x1 - n1x * h1,
      y1 - n1y * h1,
    );
  }
}
