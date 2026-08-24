const SDK = globalThis.SDK;

const PADDING = 6;
const DEFAULT_SIZE = [400, 300];
const ROW_COUNT = 4;

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

    /**
     * A placeholder box in the layout view. The real editor is a DOM element,
     * which the layout view cannot show, so this only has to mark out where it
     * will sit.
     */
    Draw(iRenderer) {
      this._inst.ApplyBlendMode(iRenderer);
      iRenderer.SetColorFillMode();

      const quad = this._inst.GetQuad();

      iRenderer.SetColorRgba(0.16, 0.18, 0.2, 1);
      iRenderer.Quad(quad);

      iRenderer.SetColorRgba(0.35, 0.39, 0.44, 1);
      iRenderer.LineQuad(quad);

      const width = this._inst.GetWidth();
      const height = this._inst.GetHeight();
      if (width < PADDING * 2 + 1 || height < PADDING * 2 + 1) return;

      // A title stripe and a few indented rows, so the placeholder reads as a
      // tree panel at a glance. The real editor is a DOM element, which the
      // layout view cannot render.
      const barHeight = Math.min(18, height * 0.18);
      const bar = new SDK.Quad();
      bar.setRect(
        quad.getTlx(),
        quad.getTly(),
        quad.getBrx(),
        quad.getTly() + barHeight,
      );
      iRenderer.SetColorRgba(0.2, 0.22, 0.25, 1);
      iRenderer.Quad(bar);

      const rowHeight = Math.min(6, (height - barHeight) / (ROW_COUNT * 2.5));
      if (rowHeight < 2) return;

      iRenderer.SetColorRgba(0.35, 0.42, 0.5, 1);
      for (let i = 0; i < ROW_COUNT; ++i) {
        const top = quad.getTly() + barHeight + PADDING + i * rowHeight * 2.5;
        if (top + rowHeight > quad.getBry() - PADDING) break;

        const indent = PADDING + (i % 2) * PADDING * 2;
        const row = new SDK.Quad();
        row.setRect(
          quad.getTlx() + indent,
          top,
          Math.min(quad.getBrx() - PADDING, quad.getTlx() + indent + width * 0.5),
          top + rowHeight,
        );
        iRenderer.Quad(row);
      }
    }

    OnPropertyChanged(id, value) {}
  };
}
