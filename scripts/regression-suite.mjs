#!/usr/bin/env node
/**
 * Global Regression Suite Runner (FASE 17)
 * 
 * Orquestra a execução de todas as verificações críticas:
 * 1. Lint (via lint-ci.mjs)
 * 2. Typecheck (tsgo)
 * 3. Unit & Integration Tests (Vitest)
 * 4. RLS Static Check
 * 5. Build Verification
 */
import { spawnSync } from "node:child_process";

const run = (command, args, name) => {
  console.log(`\n[regression] Running ${name}...`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    console.error(`\n[regression] ❌ ${name} failed with exit code ${result.status}`);
    process.exit(1);
  }
  console.log(`[regression] ✅ ${name} passed.`);
};

console.log("=== USE ERP - REGRESSION SUITE (FASE 17) ===\n");

// 1. Static Analysis
run("node", ["scripts/lint-ci.mjs"], "Lint (Strict)");
run("npm", ["run", "typecheck"], "TypeScript (Typecheck)");
run("node", ["scripts/rls-static-check.mjs"], "RLS Static Analysis");

// 2. Automated Tests
run("npm", ["run", "test", "--", "run"], "Unit & Integration (Vitest)");

// 3. Build Check
run("npm", ["run", "build"], "Vite Build");

console.log("\n=== ✅ ALL CRITICAL CHECKS PASSED ===");
process.exit(0);
