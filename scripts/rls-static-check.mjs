#!/usr/bin/env node
/**
 * RLS static check — roda os asserts SQL de `.lovable/tests/*.sql` contra o banco.
 *
 * Em CI, exige a env `RLS_CHECK_DATABASE_URL` (string de conexão somente-leitura).
 * Sem ela o script sai com 0 e apenas avisa, para não quebrar PRs de fork.
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = ".lovable/tests";
const url = process.env.RLS_CHECK_DATABASE_URL;

if (!url) {
  console.log("⚠️  RLS_CHECK_DATABASE_URL ausente — checagem de RLS ignorada.");
  process.exit(0);
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();
if (files.length === 0) {
  console.log("Nenhum arquivo .sql em .lovable/tests — nada a verificar.");
  process.exit(0);
}

let failed = 0;
for (const file of files) {
  const path = join(DIR, file);
  try {
    const out = execFileSync("psql", [url, "-v", "ON_ERROR_STOP=1", "-f", path], {
      encoding: "utf8",
    });
    console.log(`✅ ${file}`);
    if (out.trim()) console.log(out.trim());
  } catch (err) {
    failed += 1;
    console.error(`❌ ${file}`);
    console.error(err.stdout ?? "", err.stderr ?? "");
  }
}

if (failed > 0) {
  console.error(`\n${failed} arquivo(s) de checagem RLS falharam.`);
  process.exit(1);
}
console.log(`\n${files.length} arquivo(s) de checagem RLS passaram.`);
