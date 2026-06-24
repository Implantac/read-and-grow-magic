#!/usr/bin/env node
/**
 * CI lint gate.
 *
 * Runs ESLint on the entire project and fails the build when any
 * error or warning is reported, EXCEPT for `@typescript-eslint/no-explicit-any`
 * which is being cleaned up incrementally and is intentionally ignored here.
 *
 * Exit codes:
 *   0 - clean (no relevant findings)
 *   1 - relevant errors or warnings found
 *   2 - failed to run ESLint
 */
import { spawnSync } from "node:child_process";

const IGNORED_RULES = new Set(["@typescript-eslint/no-explicit-any"]);

const result = spawnSync(
  "npx",
  ["eslint", ".", "-f", "json"],
  { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
);

if (result.error) {
  console.error("Failed to spawn eslint:", result.error);
  process.exit(2);
}

let report;
try {
  report = JSON.parse(result.stdout || "[]");
} catch (e) {
  console.error("Failed to parse ESLint JSON output.");
  console.error(result.stdout?.slice(0, 2000));
  console.error(result.stderr?.slice(0, 2000));
  process.exit(2);
}

let errorCount = 0;
let warnCount = 0;
let ignoredCount = 0;
const offenders = [];

for (const file of report) {
  for (const msg of file.messages ?? []) {
    if (msg.ruleId && IGNORED_RULES.has(msg.ruleId)) {
      ignoredCount += 1;
      continue;
    }
    // Treat "unused eslint-disable directive" reports for ignored rules as ignored too.
    if (
      !msg.ruleId &&
      typeof msg.message === "string" &&
      [...IGNORED_RULES].some((r) => msg.message.includes(r))
    ) {
      ignoredCount += 1;
      continue;
    }
    if (msg.severity === 2) errorCount += 1;
    else if (msg.severity === 1) warnCount += 1;
    offenders.push({
      file: file.filePath,
      line: msg.line,
      column: msg.column,
      rule: msg.ruleId ?? "(core)",
      severity: msg.severity === 2 ? "error" : "warning",
      message: msg.message,
    });
  }
}

const total = errorCount + warnCount;
console.log(
  `[lint:ci] ignored ${ignoredCount} ${[...IGNORED_RULES].join(",")} findings`,
);
console.log(`[lint:ci] reportable: ${errorCount} errors, ${warnCount} warnings`);

if (total > 0) {
  for (const o of offenders.slice(0, 200)) {
    console.log(
      `  ${o.severity.toUpperCase()} ${o.file}:${o.line}:${o.column}  ${o.rule}  ${o.message}`,
    );
  }
  if (offenders.length > 200) {
    console.log(`  ... and ${offenders.length - 200} more`);
  }
  process.exit(1);
}

process.exit(0);
