#!/usr/bin/env node
/**
 * Lê playwright-report/results.json e emite um resumo Markdown
 * com foco na suíte Cmd/Ctrl+K (.lovable/e2e/cmdk.spec.ts).
 * Saída: stdout (consumido pelo workflow para postar no PR).
 */
import fs from "node:fs";

const REPORT = "playwright-report/results.json";
const RUN_URL = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
const ARTIFACT_URL = `${RUN_URL}#artifacts`;

if (!fs.existsSync(REPORT)) {
  console.log(`### Playwright E2E\n\n:x: Report não gerado. Ver [logs](${RUN_URL}).`);
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(REPORT, "utf8"));

type T = { title: string; ok: boolean; duration: number; file: string; error?: string };
const all: T[] = [];
const walk = (suite: any, file = suite.file ?? "") => {
  for (const s of suite.suites ?? []) walk(s, s.file ?? file);
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const r = test.results?.[0];
      all.push({
        title: spec.title,
        ok: r?.status === "passed" || r?.status === "skipped",
        duration: r?.duration ?? 0,
        file: spec.file ?? file,
        error: r?.error?.message,
      });
    }
  }
};
for (const s of data.suites ?? []) walk(s);

const cmdk = all.filter((t) => t.file.includes("cmdk.spec"));
const others = all.filter((t) => !t.file.includes("cmdk.spec"));
const stats = (rows: T[]) => {
  const pass = rows.filter((r) => r.ok).length;
  return { pass, fail: rows.length - pass, total: rows.length };
};
const cs = stats(cmdk);
const os = stats(others);
const cmdkOk = cs.fail === 0;
const overallOk = cs.fail === 0 && os.fail === 0;

const badge = overallOk ? ":white_check_mark: PASS" : ":x: FAIL";
const cmdkBadge = cmdkOk ? ":white_check_mark:" : ":x:";

let md = `## Playwright E2E — ${badge}\n\n`;
md += `**Cmd/Ctrl+K (CommandPalette)** ${cmdkBadge} \`${cs.pass}/${cs.total}\` passaram\n`;
md += `**Outros smoke tests** \`${os.pass}/${os.total}\` passaram\n\n`;

if (cmdk.length) {
  md += `### Cmd/Ctrl+K por rota\n\n| Rota | Status | Duração |\n|---|---|---|\n`;
  for (const t of cmdk) {
    md += `| \`${t.title}\` | ${t.ok ? ":white_check_mark:" : ":x:"} | ${Math.round(t.duration)}ms |\n`;
  }
  md += "\n";
}

const failures = all.filter((t) => !t.ok);
if (failures.length) {
  md += `### Falhas (${failures.length})\n\n`;
  for (const f of failures.slice(0, 10)) {
    md += `- **${f.title}** (\`${f.file}\`)\n`;
    if (f.error) md += `  \`\`\`\n  ${f.error.split("\n").slice(0, 3).join("\n  ")}\n  \`\`\`\n`;
  }
  if (failures.length > 10) md += `\n_…e mais ${failures.length - 10}_\n`;
}

md += `\n---\n:page_facing_up: [Playwright HTML report + traces](${ARTIFACT_URL}) · :gear: [Run completo](${RUN_URL})\n`;

console.log(md);
