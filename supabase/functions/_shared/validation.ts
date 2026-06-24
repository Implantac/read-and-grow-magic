// Lightweight Zod-style validation for edge functions.
// We avoid pulling zod from npm to keep cold-start fast; this mirrors the
// `safeParse` ergonomics for the small surface we actually need.

import { jsonError } from "./tenant.ts";

export type Validator<T> = (raw: unknown) =>
  | { ok: true; data: T }
  | { ok: false; errors: string[] };

export const v = {
  string(opts: { min?: number; max?: number; enum?: readonly string[] } = {}): Validator<string> {
    return (raw) => {
      if (typeof raw !== "string") return { ok: false, errors: ["must be string"] };
      if (opts.min !== undefined && raw.length < opts.min) return { ok: false, errors: [`min length ${opts.min}`] };
      if (opts.max !== undefined && raw.length > opts.max) return { ok: false, errors: [`max length ${opts.max}`] };
      if (opts.enum && !opts.enum.includes(raw)) return { ok: false, errors: [`must be one of ${opts.enum.join(",")}`] };
      return { ok: true, data: raw };
    };
  },
  uuid(): Validator<string> {
    const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return (raw) => {
      if (typeof raw !== "string" || !re.test(raw)) return { ok: false, errors: ["invalid uuid"] };
      return { ok: true, data: raw };
    };
  },
  number(opts: { min?: number; max?: number; int?: boolean } = {}): Validator<number> {
    return (raw) => {
      const n = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(n)) return { ok: false, errors: ["must be number"] };
      if (opts.int && !Number.isInteger(n)) return { ok: false, errors: ["must be integer"] };
      if (opts.min !== undefined && n < opts.min) return { ok: false, errors: [`min ${opts.min}`] };
      if (opts.max !== undefined && n > opts.max) return { ok: false, errors: [`max ${opts.max}`] };
      return { ok: true, data: n };
    };
  },
  boolean(): Validator<boolean> {
    return (raw) => typeof raw === "boolean"
      ? { ok: true, data: raw }
      : { ok: false, errors: ["must be boolean"] };
  },
  optional<T>(inner: Validator<T>): Validator<T | undefined> {
    return (raw) => (raw === undefined || raw === null) ? { ok: true, data: undefined } : inner(raw) as any;
  },
  object<S extends Record<string, Validator<any>>>(shape: S): Validator<{ [K in keyof S]: S[K] extends Validator<infer U> ? U : never }> {
    return (raw) => {
      if (!raw || typeof raw !== "object") return { ok: false, errors: ["must be object"] };
      const errs: string[] = [];
      const out: any = {};
      for (const k of Object.keys(shape)) {
        const r = shape[k]((raw as any)[k]);
        if (!r.ok) errs.push(`${k}: ${r.errors.join(", ")}`);
        else out[k] = r.data;
      }
      return errs.length ? { ok: false, errors: errs } : { ok: true, data: out };
    };
  },
};

export async function parseJson<T>(req: Request, validator: Validator<T>): Promise<
  { ok: true; data: T } | { ok: false; response: Response }
> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: jsonError("Invalid JSON body", 400) };
  }
  const r = validator(raw);
  if (!r.ok) return { ok: false, response: jsonError(`Validation failed: ${r.errors.join("; ")}`, 400) };
  return { ok: true, data: r.data };
}
