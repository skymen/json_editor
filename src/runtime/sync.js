// The runtime side of the data flow, and the one place worth optimising later.
//
// Reading is a poll: every tab's source is re-read on an interval, serialised,
// and compared with what was last sent. Only a tab whose serialisation changed
// is posted, so an idle editor costs one read and one JSON.stringify per
// interval and nothing crosses the boundary.
//
// Writing goes the other way as ops. Each op re-reads the source, applies
// itself to that fresh document and writes the result back, so an edit can
// never clobber a change the game made while the field was focused.
//
// The coarse part is that a changed tab sends its *whole* document. Replacing
// that with a diff only means changing _postDoc here and setData on the DOM
// side; nothing else knows the shape of what travels.

import { readSource, writeSource } from "./sources/index.js";
import { applyOp } from "../shared/ops.js";
import { MSG } from "../shared/protocol.js";

export class SyncEngine {
  constructor({ getTabs, getInstance, getDetect, getRuntime, post }) {
    this._getTabs = getTabs;
    this._getInstance = getInstance;
    this._getDetect = getDetect;
    this._getRuntime = getRuntime;
    this._post = post;

    this._snapshots = new Map();
    this._lastPoll = 0;
  }

  /** Forget what a tab last sent, so the next poll posts it again. */
  invalidate(tabId) {
    if (tabId === undefined) this._snapshots.clear();
    else this._snapshots.delete(tabId);
  }

  forget(tabId) {
    this._snapshots.delete(tabId);
  }

  read(tab) {
    return readSource(tab.kind, this._getInstance(tab), this._getRuntime());
  }

  /** Poll every tab, posting the ones that changed. */
  poll() {
    for (const tab of this._getTabs()) this._postDoc(tab);
  }

  /** Poll on an interval. Returns whether anything was checked. */
  tick(now, intervalMs) {
    if (now - this._lastPoll < intervalMs) return false;
    this._lastPoll = now;
    this.poll();
    return true;
  }

  _postDoc(tab) {
    const doc = this.read(tab);
    const serialized = JSON.stringify(doc ?? null);

    if (this._snapshots.get(tab.id) === serialized) return;
    this._snapshots.set(tab.id, serialized);

    this._post(MSG.DATA, { tabId: tab.id, doc, serialized });
  }

  /**
   * Replace a tab's whole document.
   *
   * Kept apart from applyOp because an op mutates the document it was handed
   * and reports what it changed, which a wholesale replacement has neither a
   * path nor an old value for. Import and Clear are the only two callers.
   */
  replaceDoc(tab, doc) {
    writeSource(tab.kind, this._getInstance(tab), doc, this._getRuntime());
    this.invalidate(tab.id);
  }

  /**
   * Apply one edit to a tab's source.
   *
   * Returns the report the trigger needs, or null when the op no longer fits
   * the document - a stale path from an edit racing a change made by events.
   */
  applyOp(tab, op) {
    const inst = this._getInstance(tab);
    const runtime = this._getRuntime();
    const doc = readSource(tab.kind, inst, runtime);
    if (doc === null || doc === undefined) return null;

    const report = applyOp(doc, op, this._getDetect());
    if (!report) return null;

    writeSource(tab.kind, inst, doc, runtime);

    // The write may have been coerced or rejected, so the next poll has to
    // re-read rather than trust what was just sent.
    this.invalidate(tab.id);
    return report;
  }
}
