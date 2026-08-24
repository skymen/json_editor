// The JSON plugin. Its scripting interface hands out and takes back a plain
// copy of the whole document, which is exactly the shape the editor works in.

export const jsonSource = {
  kind: "json",

  matches(inst) {
    return typeof inst?.getJsonDataCopy === "function";
  },

  read(inst) {
    return inst.getJsonDataCopy();
  },

  write(inst, doc) {
    inst.setJsonDataCopy(doc);
  },
};
