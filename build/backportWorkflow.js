// TEMPORARY. Delete this file once the addons that need it have been dealt with.
//
// Copy this repo's build workflow over the broken copies in the sibling addons.
//
// This is a stopgap, not a feature: publishing is not really a per-repo push of
// whatever landed on main. Which versions go out, and to which platform, is a
// judgement call, and the release notes need aggregating by hand to fit what
// each platform accepts. That belongs in the CAW tooling, not in a script that
// rewrites forty repos at once.
//
// Every addon scaffolded before the publish fix carries a build.yaml that can
// never publish: it looks for addonUrl in config.caw.js, where it has never
// lived, and calls c3addon with flag names the CLI dropped. Rewriting them is
// safe precisely because they are all byte-identical to each other, so this
// only touches a file that still matches the known-broken content and leaves
// anything hand-edited alone.
//
// Dry run unless --apply is passed. It never commits and never pushes.

import fs from "fs";
import path from "path";
import * as chalkUtils from "./chalkUtils.js";
import fromConsole from "./fromConsole.js";

const WORKFLOW = path.join(".github", "workflows", "build.yaml");

/** What the broken copies have in common, and nothing else does. */
const BROKEN_MARKERS = [
  "addonUrl:\\s?\"\\K[^\"]*' config.caw.js",
  "--authUser",
  "--uploadFile",
];

function isBroken(contents) {
  return BROKEN_MARKERS.every((marker) => contents.includes(marker));
}

export default function backportWorkflow(root, apply = false) {
  chalkUtils.step("Backporting the build workflow");

  process.chdir("..");
  const fixed = fs.readFileSync(WORKFLOW, "utf-8");
  const here = path.resolve(".");
  const parent = root ? path.resolve(root) : path.dirname(here);

  const skipped = [];
  const targets = [];

  for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const dir = path.join(parent, entry.name);
    if (dir === here) continue;

    const workflow = path.join(dir, WORKFLOW);
    if (!fs.existsSync(workflow)) continue;

    const contents = fs.readFileSync(workflow, "utf-8");
    if (contents === fixed) continue;

    if (isBroken(contents)) targets.push({ name: entry.name, workflow });
    else skipped.push(entry.name);
  }

  if (skipped.length)
    chalkUtils.warningList(
      "Left alone (workflow does not match the known-broken copy)",
      skipped
    );

  if (!targets.length) {
    chalkUtils.info("Nothing to backport.");
    return;
  }

  chalkUtils.newLine();
  chalkUtils.underline(
    apply ? "Rewriting:" : "Would rewrite (pass --apply to do it):"
  );
  for (const { name, workflow } of targets) {
    if (apply) fs.writeFileSync(workflow, fixed);
    chalkUtils.subSuccess(name, apply ? "updated" : "");
  }

  chalkUtils.newLine();
  chalkUtils.divider();
  if (apply)
    chalkUtils.success(`${targets.length} workflow(s) updated - review and commit them`);
  else chalkUtils.info(`${targets.length} workflow(s) would be updated.`);
  chalkUtils.newLine();
}

if (fromConsole(import.meta.url)) {
  chalkUtils.fromCommandLine();
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  backportWorkflow(args.find((a) => !a.startsWith("--")), apply);
}
