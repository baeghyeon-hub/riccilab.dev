#!/usr/bin/env node

/**
 * Regex-viz artifact sync
 *
 * Replaces the manual `cp -r ../regex-viz/artifacts/stageNN src/artifacts/regex-viz/`
 * dance with one command. Auto-discovers every `stageNN` directory in the
 * source tree, mirrors JSON payloads into `src/artifacts/regex-viz/`,
 * reports what actually changed, and flags orphans without deleting them.
 *
 * Usage:
 *   node scripts/sync-regex-viz.mjs            # copy drift from source → dest
 *   node scripts/sync-regex-viz.mjs --check    # no writes; exit 1 on drift
 *   node scripts/sync-regex-viz.mjs --src=path # override source tree
 *
 * Defaults:
 *   source = ../regex-viz/artifacts   (sibling repo)
 *   dest   = src/artifacts/regex-viz  (this repo)
 *
 * Why not `cp -r`: we want to see *which* payloads changed on a given
 * sync, and we want drift-check mode to be usable from CI / pre-commit
 * without touching the working tree. Byte comparison (not mtime) because
 * a fresh clone has identical bytes but different timestamps.
 *
 * Orphans (files in dest with no matching source) are reported but never
 * deleted automatically — if you want to retire a fixture, do it
 * deliberately.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── ANSI helpers ──────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};
const paint = (col, s) => `${col}${s}${C.reset}`;

// ─── Args ──────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { check: false, src: null };
  for (const a of argv.slice(2)) {
    if (a === "--check") args.check = true;
    else if (a.startsWith("--src=")) args.src = a.slice("--src=".length);
    else if (a === "-h" || a === "--help") {
      console.log("Usage: node scripts/sync-regex-viz.mjs [--check] [--src=PATH]");
      process.exit(0);
    } else {
      console.error(paint(C.red, `Unknown arg: ${a}`));
      process.exit(2);
    }
  }
  return args;
}

// ─── FS helpers ────────────────────────────────────────────
async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function listStageDirs(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && /^stage\d+$/.test(e.name))
    .map((e) => e.name)
    .sort();
}

async function listJsonFiles(dir) {
  if (!(await exists(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name)
    .sort();
}

async function bytesEqual(a, b) {
  const [ba, bb] = await Promise.all([fs.readFile(a), fs.readFile(b)]);
  if (ba.length !== bb.length) return false;
  return ba.equals(bb);
}

// ─── Core ──────────────────────────────────────────────────
/**
 * Diff one stage. Returns { newFiles, changed, unchanged, orphans }.
 * Read-only: no disk writes happen here.
 */
async function diffStage(srcDir, destDir) {
  const [srcFiles, destFiles] = await Promise.all([
    listJsonFiles(srcDir),
    listJsonFiles(destDir),
  ]);
  const destSet = new Set(destFiles);
  const srcSet = new Set(srcFiles);

  const newFiles = [];
  const changed = [];
  const unchanged = [];

  for (const name of srcFiles) {
    const srcPath = path.join(srcDir, name);
    if (!destSet.has(name)) {
      newFiles.push(name);
      continue;
    }
    const destPath = path.join(destDir, name);
    if (await bytesEqual(srcPath, destPath)) {
      unchanged.push(name);
    } else {
      changed.push(name);
    }
  }

  const orphans = destFiles.filter((n) => !srcSet.has(n));

  return { newFiles, changed, unchanged, orphans };
}

async function applyStage(srcDir, destDir, diff) {
  await fs.mkdir(destDir, { recursive: true });
  const writes = [...diff.newFiles, ...diff.changed];
  for (const name of writes) {
    await fs.copyFile(path.join(srcDir, name), path.join(destDir, name));
  }
  return writes.length;
}

// ─── Reporting ─────────────────────────────────────────────
function reportStage(stage, diff, { check }) {
  const { newFiles, changed, unchanged, orphans } = diff;
  const drift = newFiles.length + changed.length;
  const hasOrphans = orphans.length > 0;

  // Header line: stage name + headline counts.
  const parts = [];
  if (newFiles.length) parts.push(paint(C.green, `+${newFiles.length} new`));
  if (changed.length) parts.push(paint(C.yellow, `~${changed.length} changed`));
  if (unchanged.length) parts.push(paint(C.dim, `${unchanged.length} unchanged`));
  if (hasOrphans) parts.push(paint(C.magenta, `!${orphans.length} orphan`));

  const verb = drift === 0 && !hasOrphans
    ? "in sync"
    : check
    ? "would sync"
    : "synced";
  const tag = drift || hasOrphans ? paint(C.bold, stage) : paint(C.dim, stage);
  console.log(`  ${tag}  ${parts.join("  ")}  ${paint(C.dim, `(${verb})`)}`);

  // Detail lines only when something interesting happened.
  for (const n of newFiles) console.log(`    ${paint(C.green, "+")} ${n}`);
  for (const n of changed) console.log(`    ${paint(C.yellow, "~")} ${n}`);
  for (const n of orphans)
    console.log(
      `    ${paint(C.magenta, "!")} ${n}  ${paint(C.dim, "(in dest but not in source)")}`,
    );
}

// ─── Main ──────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);

  const SRC = path.resolve(
    ROOT,
    args.src ?? path.join("..", "regex-viz", "artifacts"),
  );
  const DEST = path.join(ROOT, "src", "artifacts", "regex-viz");

  if (!(await exists(SRC))) {
    console.error(paint(C.red, `Error: source not found: ${SRC}`));
    console.error(
      paint(
        C.dim,
        "  Pass --src=PATH if the regex-viz repo lives somewhere else.",
      ),
    );
    process.exit(1);
  }

  console.log("");
  console.log(`  ${paint(C.bold, "regex-viz artifact sync")}`);
  console.log(`  ${paint(C.dim, "source")}  ${SRC}`);
  console.log(`  ${paint(C.dim, "dest  ")}  ${DEST}`);
  if (args.check) console.log(`  ${paint(C.cyan, "mode")}    check (no writes)`);
  console.log("");

  const srcStages = await listStageDirs(SRC);
  const destStages = (await exists(DEST)) ? await listStageDirs(DEST) : [];
  const stageUnion = Array.from(new Set([...srcStages, ...destStages])).sort();

  if (stageUnion.length === 0) {
    console.log(paint(C.yellow, "  No stageNN directories found."));
    console.log("");
    return 0;
  }

  let totalDrift = 0;
  let totalOrphans = 0;
  let totalWritten = 0;
  const orphanStages = [];

  for (const stage of stageUnion) {
    const srcDir = path.join(SRC, stage);
    const destDir = path.join(DEST, stage);

    if (!srcStages.includes(stage)) {
      // Stage exists in dest but not src — treat every file as an orphan.
      const destFiles = await listJsonFiles(destDir);
      const diff = { newFiles: [], changed: [], unchanged: [], orphans: destFiles };
      reportStage(stage, diff, args);
      if (destFiles.length) {
        totalOrphans += destFiles.length;
        orphanStages.push(stage);
      }
      continue;
    }

    const diff = await diffStage(srcDir, destDir);
    reportStage(stage, diff, args);
    totalDrift += diff.newFiles.length + diff.changed.length;
    totalOrphans += diff.orphans.length;

    if (!args.check) {
      totalWritten += await applyStage(srcDir, destDir, diff);
    }
  }

  console.log("");

  if (args.check) {
    if (totalDrift === 0 && totalOrphans === 0) {
      console.log(`  ${paint(C.green, "✓")} in sync`);
      console.log("");
      return 0;
    }
    const bits = [];
    if (totalDrift) bits.push(`${totalDrift} file(s) out of date`);
    if (totalOrphans) bits.push(`${totalOrphans} orphan(s)`);
    console.log(`  ${paint(C.red, "✗")} drift detected — ${bits.join(", ")}`);
    console.log(`  ${paint(C.dim, "run `node scripts/sync-regex-viz.mjs` to update.")}`);
    console.log("");
    return 1;
  }

  if (totalWritten === 0) {
    console.log(`  ${paint(C.green, "✓")} already up to date`);
  } else {
    console.log(`  ${paint(C.green, "✓")} wrote ${totalWritten} file(s)`);
  }
  if (totalOrphans) {
    console.log(
      `  ${paint(C.yellow, "⚠")} ${totalOrphans} orphan(s) left in place${
        orphanStages.length ? ` (${orphanStages.join(", ")})` : ""
      }`,
    );
    console.log(
      `  ${paint(C.dim, "  remove manually if the source retired them on purpose.")}`,
    );
  }
  console.log("");
  return 0;
}

main()
  .then((code) => process.exit(code ?? 0))
  .catch((err) => {
    console.error(paint(C.red, `sync failed: ${err.stack || err.message}`));
    process.exit(1);
  });
