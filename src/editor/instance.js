const SDK = globalThis.SDK;

const DEFAULT_SIZE = [400, 300];

// Construct dark, the same ramp steps theme.construct-dark.css uses.
const PANEL = [0x57 / 255, 0x57 / 255, 0x57 / 255]; // gray11, dialog body
const BAR = [0x5e / 255, 0x5e / 255, 0x5e / 255]; // gray12, dialog caption
const MARK = [0x29 / 255, 0xf3 / 255, 0xd0 / 255]; // the accent teal
const EDGE = [0x17 / 255, 0x17 / 255, 0x17 / 255]; // gray3, C3's dialog border
const EDGE_WIDTH = 2; // screen pixels, held constant across zoom levels

const BAR_HEIGHT = 0.13; // of the object height
const BAR_MAX = 22; // but never taller than this

const MARK_HEIGHT = 0.4; // of the shorter side
const MARK_MAX_WIDTH = 0.7; // of the object width
const BRACE_GAP = 0.34; // between the two arm ends, in brace heights
const STEPS = 40; // samples across half a brace

/*
 * The brace is Construct's own, read off the JSON plugin's icon (a 435x338
 * artwork) and normalised to a brace height of 1. It is not a tapered curve:
 * the stroke is a constant 40 units thick everywhere, and the shape is built
 * from straight runs joined by circular fillets.
 *
 *   - a vertical spine between x 50 and 90
 *   - arms at each end reaching out to x 131.5, turning through an outer
 *     radius of 52 and an inner radius of 12 (52 - 12 = the thickness)
 *   - a middle arm reaching the other way to x 0, turning through a fillet of
 *     radius 34 on the outside
 *   - an inner edge that leaves the spine at y 115 on a single circular arc,
 *     tangent there, meeting its mirror at the middle point
 *
 * That last arc is drawn as two cubics in the artwork; solving for the circle
 * tangent to the spine and through the tip gives r = 74.249, and the cubic's
 * own midpoint sits 74.245 from that centre, so a true arc reproduces it.
 */
const S = 338;
const B_WIDTH = 131.5 / S;
const ARM_INNER_Y = 40 / S;
const END_CX = 102 / S;
const END_CY = 52 / S;
const END_OUTER_R = 52 / S;
const END_INNER_R = 12 / S;
const SPINE_OUTER = 50 / S;
const SPINE_INNER = 90 / S;
const WAIST_Y = 115 / S; // both edges leave the spine here
const FILLET_CX = 16 / S;
const FILLET_R = 34 / S;
const MID_ARM_Y = 149 / S; // the middle arm's flat edge starts here
const INNER_TIP = 66.7109 / S;

// The inner arc, from its tangency at the waist and the middle point it reaches.
const INNER_DX = SPINE_INNER - INNER_TIP;
const INNER_DY = 0.5 - WAIST_Y;
const INNER_R = (INNER_DX * INNER_DX + INNER_DY * INNER_DY) / (2 * INNER_DX);
const INNER_CX = SPINE_INNER - INNER_R;

const EPS = 1e-6;
// The breakpoints land exactly on the ends of the arcs, and mirroring a height
// can leave it a few ULPs the wrong side of one. chord() clamps, so widening
// the ranges by a hair just pins those samples to the arc's endpoint.
const TOL = 1e-9;

/**
 * The layout view cannot render the real editor - it is a DOM element - so the
 * object draws a bar and a { } mark instead.
 *
 * The editor renderer has no mesh call, but it does have Quad2, which takes
 * four arbitrary corners. A brace covers exactly one horizontal span at every
 * height, so it is drawn as a strip of trapezoids: one quad between each pair
 * of sampled rows, spanning that row's outer and inner edges.
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
      const { cx, cy, height, gap } = g.mark;

      iRenderer.SetColorRgba(MARK[0], MARK[1], MARK[2], 1);
      const emit = (...corners) => iRenderer.Quad2(...corners);
      const tip = gap / 2 + B_WIDTH * height;
      braceQuads(emit, cx - tip, cy, height, 1);
      braceQuads(emit, cx + tip, cy, height, -1);
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
 * does. Returns null when the object is too small to draw anything in, and a
 * null `mark` when only the bar fits.
 */
export function layout(x, y, w, h) {
  if (w < 12 || h < 12) return null;

  const barH = Math.min(h * BAR_HEIGHT, BAR_MAX);
  const bodyH = h - barH;

  // Widthwise the pair is two braces plus the gap, all in brace heights, so a
  // wide-but-short object shrinks the mark rather than overflowing it.
  const span = 2 * B_WIDTH + BRACE_GAP;
  const height = Math.min(
    Math.min(w, bodyH) * MARK_HEIGHT,
    (w * MARK_MAX_WIDTH) / span,
  );

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
            gap: BRACE_GAP * height,
          },
  };
}

/**
 * Half a chord of a circle of radius `r`, `d` from its centre.
 *
 * Clamped at zero: the breakpoints land exactly on the ends of these arcs, and
 * there r - d is a rounding error either side of nothing, which would take the
 * square root of a hair-negative number and give NaN.
 */
function chord(r, d) {
  return Math.sqrt(Math.max(0, r * r - d * d));
}

/** The outer edge of a brace at `u`, measured down from its top. */
function outerAt(u) {
  if (u <= END_CY + TOL) return END_CX - chord(END_OUTER_R, END_CY - u);
  if (u <= WAIST_Y + TOL) return SPINE_OUTER;
  if (u <= MID_ARM_Y + TOL) return FILLET_CX + chord(FILLET_R, u - WAIST_Y);
  return 0;
}

/** The inner edge of a brace at `u`, the side its arms reach towards. */
function innerAt(u) {
  if (u < ARM_INNER_Y) return B_WIDTH;
  if (u <= END_CY + TOL) return END_CX - chord(END_INNER_R, END_CY - u);
  if (u <= WAIST_Y + TOL) return SPINE_INNER;
  return INNER_CX + chord(INNER_R, u - WAIST_Y);
}

/** Both edges at `y`, folded onto the top half since a brace is symmetric. */
export function braceEdges(y) {
  const u = y <= 0.5 ? y : 1 - y;
  return [outerAt(u), innerAt(u)];
}

/**
 * The heights to sample a brace at.
 *
 * Every place the shape changes construction is included, so no trapezoid ever
 * spans two of them and cuts a corner. The arm's underside is a genuine
 * discontinuity in the inner edge - it steps from the arm's end back to the
 * corner - so that height appears twice, a hair apart, to keep the edge
 * vertical.
 */
export function braceRows(steps = STEPS) {
  const breaks = [0, ARM_INNER_Y - EPS, ARM_INNER_Y, END_CY, WAIST_Y, MID_ARM_Y, 0.5];
  const half = [];

  for (let i = 0; i < breaks.length - 1; ++i) {
    const a = breaks[i];
    const b = breaks[i + 1];
    const n = Math.max(1, Math.round((steps * (b - a)) / 0.5));
    for (let k = 0; k < n; ++k) half.push(a + ((b - a) * k) / n);
  }
  half.push(0.5);

  // Each row is [height, sample point]. The bottom half reuses the top half's
  // sample points rather than folding its heights back, so a mirrored row is
  // measured at exactly the same place on the profile as its twin.
  const rows = half.map((u) => [u, u]);
  for (let i = half.length - 2; i >= 0; --i) rows.push([1 - half[i], half[i]]);

  return rows;
}

/**
 * Emit one brace as a strip of trapezoids.
 *
 * `tipX` is the middle point and `sign` says which way the arms reach, so the
 * same function draws both halves of the pair.
 */
export function braceQuads(emit, tipX, cy, height, sign, steps = STEPS) {
  const rows = braceRows(steps);
  const top = cy - height / 2;
  const X = (v) => tipX + sign * v * height;
  const Y = (v) => top + v * height;

  for (let i = 0; i < rows.length - 1; ++i) {
    const [y0, u0] = rows[i];
    const [y1, u1] = rows[i + 1];
    const o0 = outerAt(u0);
    const n0 = innerAt(u0);
    const o1 = outerAt(u1);
    const n1 = innerAt(u1);

    emit(X(o0), Y(y0), X(n0), Y(y0), X(n1), Y(y1), X(o1), Y(y1));
  }
}

function rect(iRenderer, x, y, w, h) {
  const q = new SDK.Quad();
  q.setRect(x, y, x + w, y + h);
  iRenderer.Quad(q);
}
