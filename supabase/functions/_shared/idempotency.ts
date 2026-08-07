import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export async function checkIdempotency(
  supabase: ReturnType<typeof createClient>,
  key: string,
  context: string,
) {
  const { data, error } = await supabase
    .from("idempotency_keys")
    .select("*")
    .eq("idempotency_key", key)
    .eq("context", context)
    .maybeSingle();

  if (error) {
    console.error("[idempotency] lookup error:", error.message);
    throw new Error("Falha ao validar idempotência");
  }

  return data;
}

export async function recordIdempotency(
  supabase: ReturnType<typeof createClient>,
  key: string,
  context: string,
  responseBody: any,
  status: number = 200,
) {
  const { error } = await supabase.from("idempotency_keys").upsert(
    {
      idempotency_key: key,
      context,
      response_body: responseBody,
      response_status: status,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
    },
    { onConflict: "idempotency_key, context" },
  );

  if (error) {
    console.error("[idempotency] record error:", error.message);
  }
}
