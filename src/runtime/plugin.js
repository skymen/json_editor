import { MSG } from "../shared/protocol.js";

const ELEMENT_MESSAGE_HANDLERS = [
  [MSG.OP, (inst, e) => inst._onOpMessage(e)],
  [MSG.EVENT, (inst, e) => inst._onEventMessage(e)],
];

export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();
      // The batch form _addElementMessageHandlers recurses into itself in r494
      // and always throws, so register one handler at a time.
      for (const [name, handler] of ELEMENT_MESSAGE_HANDLERS) {
        this._addElementMessageHandler(name, handler);
      }
    }
  };
}
