// DOM handler. Creates the host element for each editor instance, wires it to
// an Editor, and routes messages between that Editor and the runtime.
//
// Everything visual lives below this file; everything Construct-shaped lives
// above it. This class is only the seam.

import { Editor } from "./editor/Editor.js";
import { MSG, STYLE_MODE } from "../shared/protocol.js";

export default function (parentClass) {
  return class extends parentClass {
    constructor(iRuntime) {
      super(iRuntime);

      // The batch form of this recurses into itself in some releases, so
      // handlers are registered one at a time.
      this.AddDOMElementMessageHandler(MSG.TABS, (elem, data) =>
        this._withEditor(elem, (editor) =>
          editor.setTabs(data["tabs"] ?? [], data["activeId"] ?? null),
        ),
      );

      this.AddDOMElementMessageHandler(MSG.DATA, (elem, data) =>
        this._withEditor(elem, (editor) =>
          editor.setData(data["tabId"], data["doc"], data["serialized"]),
        ),
      );

      this.AddDOMElementMessageHandler(MSG.CONFIG, (elem, data) =>
        this._withEditor(elem, (editor) => editor.setConfig(data["config"])),
      );

      this.AddDOMElementMessageHandler(MSG.STYLE, (elem, data) =>
        this._withEditor(elem, (editor) => applyStyle(editor, data)),
      );

      this.AddDOMElementMessageHandler(MSG.COMMAND, (elem, data) =>
        this._withEditor(elem, (editor) =>
          editor.applyCommand(data["name"], data["payload"] ?? {}),
        ),
      );
    }

    CreateElement(elementId, e) {
      const elem = document.createElement("div");
      if (e["style-attribute"]) elem.setAttribute("style", e["style-attribute"]);
      elem.style.position = "absolute";
      if (e["id"]) elem.id = e["id"];
      if (e["className"]) elem.className = e["className"];

      const editor = new Editor(elem, {
        onOp: (op) => this.PostToRuntimeElement(MSG.OP, elementId, { op }),
        onEvent: (name, payload) =>
          this.PostToRuntimeElement(MSG.EVENT, elementId, { name, payload }),
      });

      elem._jeEditor = editor;

      this.UpdateState(elem, e);
      return elem;
    }

    DestroyElement(elem) {
      elem._jeEditor?.destroy();
      elem._jeEditor = null;
      if (super.DestroyElement) super.DestroyElement(elem);
    }

    /**
     * Property-driven state. Sent whenever the runtime instance's own view of
     * the configuration changes, which covers both creation and every Set
     * action.
     */
    UpdateState(elem, e) {
      const editor = elem._jeEditor;
      if (!editor) return;

      if (e["config"]) editor.setConfig(e["config"]);
      if (e["style"]) applyStyle(editor, e["style"]);
    }

    _withEditor(elem, fn) {
      const editor = elem?._jeEditor;
      if (!editor) return;
      try {
        fn(editor);
      } catch (err) {
        console.error("[JSON Editor]", err);
      }
    }
  };
}

function applyStyle(editor, style) {
  if (!style) return;

  if (style["mode"] === STYLE_MODE.THEME) {
    editor.setTheme(style["theme"]);
    return;
  }

  editor.applyCss(style["css"] ?? "", style["mode"]);
}
