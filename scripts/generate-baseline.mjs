#!/usr/bin/env node
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = process.cwd();
const OUTPUT = join(ROOT, "docs", "governance", "BASELINE_CURRENT.md");
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".sql"]);

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git", "playwright-report", "test-results"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

function existingFiles(directory) {
  try {
    return walk(join(ROOT, directory));
  } catch {
    return [];
  }
}

function sourceFiles(...directories) {
  return directories.flatMap(existingFiles).filter((file) => SOURCE_EXTENSIONS.has(extname(file)));
}

function countMatches(files, pattern) {
  return files.reduce((total, file) => {
    const content = readFileSync(file, "utf8");
    return total + (content.match(pattern) ?? []).length;
  }, 0);
}

const appFiles = sourceFiles("src");
const routeFiles = sourceFiles("src/routes").concat(join(ROOT, "src", "App.tsx"));
const testFiles = sourceFiles("src", "tests", ".lovable/e2e").filter((file) => /(?:test|spec)\.[jt]sx?$/.test(file));
const functionFiles = existingFiles("supabase/functions").filter((file) => file.endsWith("index.ts"));
const migrations = existingFiles("supabase/migrations").filter((file) => file.endsWith(".sql"));
const routeCount = countMatches(routeFiles.filter((file) => {
  try { return statSync(file).isFile(); } catch { return false; }
}), /\bpath\s*=|\bpath\s*:/g);

const packageJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const generatedAt = new Date().toISOString();
const rows = [
  ["Rotas declaradas", routeCount],
  ["Arquivos de aplicação TS/TSX", appFiles.filter((file) => /\.[jt]sx?$/.test(file)).length],
  ["Testes automatizados", testFiles.length],
  ["Edge Functions", functionFiles.length],
  ["Migrations", migrations.length],
  ["Casts `any` na aplicação", countMatches(appFiles, /\bas any\b|:\s*any\b|<any>/g)],
  ["Chamadas de dados em arquivos TSX", countMatches(appFiles.filter((file) => file.endsWith(".tsx")), /supabase\.(?:from|rpc|functions)|\.from\(['"]/g)],
];

const content = `# Baseline técnico atual

Gerado automaticamente em ${generatedAt} por \`npm run baseline\`.

## Ambiente

- Node: ${process.version}
- Projeto: ${packageJson.name}
- Versão: ${packageJson.version}

## Inventário

| Item | Quantidade |
|---|---:|
${rows.map(([label, value]) => `| ${label} | ${value} |`).join("\n")}

## Gates disponíveis

${Object.entries(packageJson.scripts)
  .filter(([name]) => ["lint:ci", "typecheck", "test", "build", "e2e", "regression", "baseline"].includes(name))
  .map(([name, command]) => `- \`npm run ${name}\` — \`${command}\``)
  .join("\n")}

## Regras de evidência

- Uma etapa ignorada por falta de credencial não pode ser reportada como aprovada.
- Um E2E crítico deve preparar ou exigir dados e confirmar o efeito final.
- Este arquivo mede estrutura; resultados de execução pertencem ao relatório do pipeline.
`;

mkdirSync(join(ROOT, "docs", "governance"), { recursive: true });
writeFileSync(OUTPUT, content);
console.log(`Baseline salvo em ${relative(ROOT, OUTPUT)}`);