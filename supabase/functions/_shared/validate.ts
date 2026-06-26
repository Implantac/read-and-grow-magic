// Shared input validation helpers for edge functions.
// Uses Zod via esm.sh. Returns a 400 Response on failure.
import { z, ZodSchema } from "https://esm.sh/zod@3.23.8";

export { z };

export type ValidationOk<T> = { ok: true; data: T };
export type ValidationErr = { ok: false; response: Response };

const jsonHeaders = (corsHeaders: Record<string, string>) => ({
  ...corsHeaders,
  "Content-Type": "application/json",
});

export async function validateJson<T>(
  req: Request,
  schema: ZodSchema<T>,
  corsHeaders: Record<string, string>,
): Promise<ValidationOk<T> | ValidationErr> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "invalid_json" }),
        { status: 400, headers: jsonHeaders(corsHeaders) },
      ),
    };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "validation_error", fields: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: jsonHeaders(corsHeaders) },
      ),
    };
  }
  return { ok: true, data: parsed.data };
}
