/**
 * Validação centralizada para inputs numéricos e monetários (pt-BR).
 *
 * - Aceita strings no formato pt-BR ("1.234,56") e en-US ("1234.56").
 * - Rejeita NaN, Infinity e formatos inválidos.
 * - Por padrão, rejeita negativos (configurável).
 *
 * Uso típico em onChange:
 *   const r = parseNumericInput(e.target.value, { allowNegative: false });
 *   if (r.ok) setValue(r.value);
 */

export interface ParseNumericOptions {
  /** Permite valores negativos. Default: false. */
  allowNegative?: boolean;
  /** Permite zero. Default: true. */
  allowZero?: boolean;
  /** Valor mínimo inclusivo. */
  min?: number;
  /** Valor máximo inclusivo. */
  max?: number;
  /** Limita casas decimais (truncamento). */
  maxDecimals?: number;
  /** Aceita apenas inteiros. Default: false. */
  integer?: boolean;
}

export type ParseNumericResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

/**
 * Converte string pt-BR/en-US em número, sem heurísticas mágicas.
 * Regras:
 *  - "1.234,56" → 1234.56 (BR)
 *  - "1234,56"  → 1234.56 (BR)
 *  - "1234.56"  → 1234.56 (EN)
 *  - "1,234.56" → 1234.56 (EN com milhares)
 *  - "" / null  → NaN
 */
export function parseLocaleNumber(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (raw === null || raw === undefined) return NaN;
  let s = String(raw).trim();
  if (s === "") return NaN;
  // Remove símbolos comuns de moeda e espaços (incluindo NBSP)
  s = s.replace(/[R$\s\u00A0]/g, "");
  if (s === "" || s === "-" || s === "+") return NaN;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    // O último separador é o decimal
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      // BR: pontos = milhares, vírgula = decimal
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      // EN: vírgulas = milhares, ponto = decimal
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    // Apenas vírgula → decimal BR
    s = s.replace(",", ".");
  }
  // apenas ponto → já é decimal en-US

  if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export function parseNumericInput(
  raw: unknown,
  opts: ParseNumericOptions = {},
): ParseNumericResult {
  const {
    allowNegative = false,
    allowZero = true,
    min,
    max,
    maxDecimals,
    integer = false,
  } = opts;

  const n = parseLocaleNumber(raw);
  if (!Number.isFinite(n)) return { ok: false, error: "Valor numérico inválido" };
  if (integer && !Number.isInteger(n)) return { ok: false, error: "Valor deve ser inteiro" };
  if (!allowNegative && n < 0) return { ok: false, error: "Valor não pode ser negativo" };
  if (!allowZero && n === 0) return { ok: false, error: "Valor não pode ser zero" };
  if (min !== undefined && n < min) return { ok: false, error: `Valor mínimo: ${min}` };
  if (max !== undefined && n > max) return { ok: false, error: `Valor máximo: ${max}` };

  let value = n;
  if (maxDecimals !== undefined && maxDecimals >= 0) {
    const factor = Math.pow(10, maxDecimals);
    value = Math.trunc(value * factor) / factor;
  }
  return { ok: true, value };
}

/** Atalho para valores monetários (R$): >= 0, 2 casas decimais. */
export function parseMoneyInput(
  raw: unknown,
  opts: Omit<ParseNumericOptions, "maxDecimals"> = {},
): ParseNumericResult {
  return parseNumericInput(raw, { allowNegative: false, maxDecimals: 2, ...opts });
}

/** Atalho para quantidades: inteiro >= 1 por default. */
export function parseQuantityInput(
  raw: unknown,
  opts: ParseNumericOptions = {},
): ParseNumericResult {
  return parseNumericInput(raw, {
    integer: true,
    allowNegative: false,
    allowZero: false,
    min: 1,
    ...opts,
  });
}

/**
 * Versão "safe" que sempre devolve um número (ou fallback) — útil em onChange
 * controlados onde precisamos manter o estado mesmo durante a digitação.
 * Use parseNumericInput quando precisar reportar erro ao usuário.
 */
export function toSafeNumber(
  raw: unknown,
  fallback = 0,
  opts: ParseNumericOptions = {},
): number {
  const r = parseNumericInput(raw, opts);
  return r.ok ? r.value : fallback;
}
