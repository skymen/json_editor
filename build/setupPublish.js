// Put the publish secrets on this addon's GitHub repo, in one command.
//
// GitHub has no account-level Actions secrets - only repo, environment and
// organization scopes - so a personal repo has to be told the credentials
// itself. Caching them under ~/.caw means that is a prompt the first time and
// nothing at all for every addon after it.
//
// Values go to `gh` through stdin rather than --body, so the password never
// lands in argv where `ps` could read it.

import fs from "fs";
import os from "os";
import path from "path";
import readline from "readline";
import { execFileSync, execSync } from "child_process";
import * as chalkUtils from "./chalkUtils.js";
import fromConsole from "./fromConsole.js";

const CREDENTIALS_DIR = path.join(os.homedir(), ".caw");
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, "publish-credentials.json");

/** The construct.net login c3addon drives, plus the optional itch.io key. */
const SECRETS = [
  { key: "username", secret: "C3_AUTH_USER", prompt: "Construct.net username" },
  {
    key: "password",
    secret: "C3_AUTH_PASSWORD",
    prompt: "Construct.net password",
    hidden: true,
  },
  { key: "butlerApiKey", secret: "BUTLER_API_KEY", optional: true },
];

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    // readline has no password mode, so the prompt is written by hand and the
    // echo of every keystroke is swallowed until the answer comes back.
    if (hidden) {
      process.stdout.write(`${question}: `);
      rl._writeToOutput = () => {};
    }

    rl.question(hidden ? "" : `${question}: `, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeCache(credentials) {
  fs.mkdirSync(CREDENTIALS_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), {
    mode: 0o600,
  });
  // An existing file keeps its old mode, so set it explicitly either way.
  fs.chmodSync(CREDENTIALS_FILE, 0o600);
}

/** "owner/name", from whatever shape the origin remote is written in. */
function currentRepo() {
  let remote;
  try {
    remote = execSync("git remote get-url origin", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }

  const match = remote.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
  return match ? match[1] : null;
}

function hasWorkingGh() {
  try {
    execSync("gh auth status", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function setSecret(repo, name, value) {
  execFileSync("gh", ["secret", "set", name, "--repo", repo, "--body-file", "-"], {
    input: value,
    stdio: ["pipe", "ignore", "inherit"],
  });
}

export default async function setupPublish() {
  chalkUtils.step("Setting up publishing");

  // The script runs from build/, but the repo is the directory above it.
  process.chdir("..");

  const repo = currentRepo();
  if (!repo) {
    chalkUtils.error(
      "No GitHub origin remote found.\n" +
        chalkUtils._errorUnderline(
          "Create the repo first, then run this again."
        )
    );
    return;
  }

  if (!hasWorkingGh()) {
    chalkUtils.error(
      "The GitHub CLI is not installed or not logged in.\n" +
        chalkUtils._errorUnderline("Install gh, run `gh auth login`, then retry.")
    );
    chalkUtils.newLine();
    chalkUtils.info(
      `Or set them by hand at https://github.com/${repo}/settings/secrets/actions`
    );
    return;
  }

  const credentials = readCache();
  let prompted = false;

  for (const { key, prompt, hidden, optional } of SECRETS) {
    if (credentials[key] || optional) continue;
    credentials[key] = await ask(prompt, hidden);
    prompted = true;
  }

  if (!credentials.username || !credentials.password) {
    chalkUtils.error("A username and a password are both needed.");
    return;
  }

  if (prompted) {
    const save = await ask(
      `Remember these in ${CREDENTIALS_FILE} so future addons need no prompt? [Y/n]`
    );
    if (!save || save.toLowerCase().startsWith("y")) {
      writeCache(credentials);
      chalkUtils.subSuccess("Credentials cached", `(${CREDENTIALS_FILE}, 0600)`);
    }
  }

  chalkUtils.newLine();
  chalkUtils.subStep(`Writing secrets to ${repo}`);

  for (const { key, secret } of SECRETS) {
    if (!credentials[key]) continue;
    setSecret(repo, secret, credentials[key]);
    chalkUtils.subSuccess(secret, "set");
  }

  chalkUtils.newLine();
  chalkUtils.divider();
  chalkUtils.success("Publishing is set up");
  chalkUtils.newLine();
  chalkUtils.info(
    "The next push to main will build, release, and publish to the addon URL in buildconfig.js."
  );
  chalkUtils.newLine();
}

if (fromConsole(import.meta.url)) {
  chalkUtils.fromCommandLine();
  setupPublish();
}
