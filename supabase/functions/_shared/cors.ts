// Shared CORS helper with optional allowlist via env var ALLOWED_ORIGINS (comma-separated).
// Falls back to '*' for backwards compatibility. Webhooks (PIX/RFID/etc.) should NOT use this —
// they are server-to-server and don't need browser CORS at all.

const ALLOWLIST = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const BASE_HEADERS = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  let allowOrigin = "*";
  if (ALLOWLIST.length > 0) {
    allowOrigin = ALLOWLIST.includes(origin) ? origin : ALLOWLIST[0];
  }
  return { ...BASE_HEADERS, "Access-Control-Allow-Origin": allowOrigin };
}

export function handleCorsPreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }
  return null;
}
