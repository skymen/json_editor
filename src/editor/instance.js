const SDK = globalThis.SDK;

const DEFAULT_SIZE = [400, 300];

// Construct dark, the same ramp steps theme.construct-dark.css uses.
const PANEL = [0x57 / 255, 0x57 / 255, 0x57 / 255]; // gray11, dialog body
const BAR = [0x5e / 255, 0x5e / 255, 0x5e / 255]; // gray12, dialog caption
const MARK = [0x29 / 255, 0xf3 / 255, 0xd0 / 255]; // the accent teal

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

    Draw(iRenderer) {
      this._inst.ApplyBlendMode(iRenderer);
      iRenderer.SetColorFillMode();

      const quad = this._inst.GetQuad();
      const x = quad.getTlx();
      const y = quad.getTly();
      const w = this._inst.GetWidth();
      const h = this._inst.GetHeight();

      iRenderer.SetColorRgba(PANEL[0], PANEL[1], PANEL[2], 1);
      iRenderer.Quad(quad);

      if (w < 12 || h < 12) return;

      const barH = Math.min(h * BAR_HEIGHT, BAR_MAX);
      iRenderer.SetColorRgba(BAR[0], BAR[1], BAR[2], 1);
      rect(iRenderer, x, y, w, barH);

      // Centred in what is left below the bar.
      const bodyH = h - barH;
      const cx = x + w / 2;
      const cy = y + barH + bodyH / 2;

      const height = Math.min(w, bodyH) * MARK_HEIGHT;
      if (height < 6) return;

      const braceW = height * BRACE_WIDTH;
      const gap = height * BRACE_GAP;
      const thickness = Math.max(1, height * THICKNESS);

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
