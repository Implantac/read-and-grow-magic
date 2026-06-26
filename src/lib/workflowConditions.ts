/**
 * Workflow Engine v2 — avaliador de condições determinístico.
 *
 * Suporta um subset seguro de expressões JsonLogic-like, sem `eval`:
 *   { "==": [{ "var": "amount" }, 1000] }
 *   { ">": [{ "var": "amount" }, 5000] }
 *   { "and": [ {">": [{"var": "amount"}, 1000]}, {"==": [{"var":"approved"}, true]} ] }
 *   { "in": [{ "var": "status" }, ["draft","pending"]] }
 *
 * Branches no step: `{ when: <expr>, next: "<step_key>" }[]`.
 * Avaliados na ordem; primeiro match vence. Fallback = step.next.
 */

export type ConditionExpr =
  | { var: string }
  | { '==': [ConditionExpr | unknown, ConditionExpr | unknown] }
  | { '!=': [ConditionExpr | unknown, ConditionExpr | unknown] }
  | { '>': [ConditionExpr | unknown, ConditionExpr | unknown] }
  | { '>=': [ConditionExpr | unknown, ConditionExpr | unknown] }
  | { '<': [ConditionExpr | unknown, ConditionExpr | unknown] }
  | { '<=': [ConditionExpr | unknown, ConditionExpr | unknown] }
  | { and: ConditionExpr[] }
  | { or: ConditionExpr[] }
  | { not: ConditionExpr }
  | { in: [ConditionExpr | unknown, unknown[]] }
  | unknown;

export interface Branch {
  when: ConditionExpr;
  next: string;
  label?: string;
}

function getPath(ctx: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, ctx);
}

export function evaluateCondition(
  expr: ConditionExpr,
  ctx: Record<string, unknown> = {},
): unknown {
  if (expr === null || typeof expr !== 'object') return expr;

  const e = expr as Record<string, unknown>;

  if ('var' in e && typeof e.var === 'string') return getPath(ctx, e.var);

  const arg = (i: number, arr: unknown) =>
    evaluateCondition((arr as unknown[])[i] as ConditionExpr, ctx);

  if ('==' in e) return arg(0, e['==']) == arg(1, e['==']);
  if ('!=' in e) return arg(0, e['!=']) != arg(1, e['!=']);
  if ('>' in e) return Number(arg(0, e['>'])) > Number(arg(1, e['>']));
  if ('>=' in e) return Number(arg(0, e['>='])) >= Number(arg(1, e['>=']));
  if ('<' in e) return Number(arg(0, e['<'])) < Number(arg(1, e['<']));
  if ('<=' in e) return Number(arg(0, e['<='])) <= Number(arg(1, e['<=']));
  if ('and' in e) return (e.and as ConditionExpr[]).every((x) => !!evaluateCondition(x, ctx));
  if ('or' in e) return (e.or as ConditionExpr[]).some((x) => !!evaluateCondition(x, ctx));
  if ('not' in e) return !evaluateCondition(e.not as ConditionExpr, ctx);
  if ('in' in e) {
    const [needle, list] = e.in as [ConditionExpr, unknown[]];
    return (list ?? []).includes(evaluateCondition(needle, ctx) as never);
  }

  return expr;
}

/** Resolve próxima etapa avaliando branches; fallback = defaultNext. */
export function resolveNextStep(
  branches: Branch[] | undefined,
  defaultNext: string | null | undefined,
  ctx: Record<string, unknown>,
): string | null {
  if (Array.isArray(branches)) {
    for (const br of branches) {
      try {
        if (evaluateCondition(br.when, ctx)) return br.next;
      } catch {
        // condição inválida → ignora e segue
      }
    }
  }
  return defaultNext ?? null;
}

/** Helper de UI: parse seguro de JSON; retorna null se inválido. */
export function safeParseJson<T = unknown>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
