#!/usr/bin/env node
/**
 * Teste de carga simples, sem dependências externas.
 *
 *   LOAD_URL=https://app.exemplo.com/ LOAD_CONC=20 LOAD_REQS=400 node scripts/load-test.mjs
 *
 * Mede latência (p50/p90/p95/p99), taxa de erro e throughput.
 * Metas de aceite documentadas em .lovable/ops/backup-restore.md.
 */

const URL_ = process.env.LOAD_URL ?? 'http://localhost:8080/';
const CONC = Number(process.env.LOAD_CONC ?? 10);
const REQS = Number(process.env.LOAD_REQS ?? 200);
const TIMEOUT_MS = Number(process.env.LOAD_TIMEOUT ?? 15000);

/** @type {number[]} */
const latencies = [];
let errors = 0;
let done = 0;

function pct(sorted, p) {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[i];
}

async function once() {
  const started = performance.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(URL_, { signal: ctrl.signal, headers: { accept: 'text/html,application/json' } });
    await res.arrayBuffer();
    if (!res.ok) errors++;
  } catch {
    errors++;
  } finally {
    clearTimeout(timer);
    latencies.push(performance.now() - started);
    done++;
  }
}

let issued = 0;
async function worker() {
  while (issued < REQS) {
    issued++;
    await once();
  }
}

const wallStart = performance.now();
await Promise.all(Array.from({ length: CONC }, worker));
const wallMs = performance.now() - wallStart;

const sorted = [...latencies].sort((a, b) => a - b);
const avg = sorted.reduce((a, b) => a + b, 0) / (sorted.length || 1);
const errRate = (errors / (latencies.length || 1)) * 100;

console.log(`\nAlvo:        ${URL_}`);
console.log(`Concorrência ${CONC} · requisições ${latencies.length}`);
console.log(`Duração      ${(wallMs / 1000).toFixed(2)}s · ${(latencies.length / (wallMs / 1000)).toFixed(1)} req/s`);
console.log(`Erros        ${errors} (${errRate.toFixed(2)}%)`);
console.log(`Latência ms  avg ${avg.toFixed(0)} · p50 ${pct(sorted, 50).toFixed(0)} · p90 ${pct(sorted, 90).toFixed(0)} · p95 ${pct(sorted, 95).toFixed(0)} · p99 ${pct(sorted, 99).toFixed(0)}`);

const p95 = pct(sorted, 95);
const failed = errRate > 0.5 || p95 > 2000;
console.log(failed ? '\nRESULTADO: FORA DA META (p95 <= 2000ms, erros <= 0,5%)\n' : '\nRESULTADO: dentro da meta\n');
process.exit(failed ? 1 : 0);
