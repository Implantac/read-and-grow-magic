import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Idempotency cache. ALWAYS tenant-scoped: a key is only ever matched within
 * the caller's own company, so a colliding key from another tenant can never
 * return that tenant's cached response.
 */
export async function checkIdempotency(
  supabase: ReturnType<typeof createClient>,
  key: string,
  context: string,
  companyId: string,
) {
  if (!companyId) throw new Error("Tenant obrigatório para idempotência");

  const { data, error } = await supabase
    .from("idempotency_keys")
    .select("*")
    .eq("idempotency_key", key)
    .eq("request_path", context)
    .eq("company_id", companyId)
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
  companyId: string,
  responseBody: unknown,
  status: number = 200,
) {
  if (!companyId) throw new Error("Tenant obrigatório para idempotência");

  const { error } = await supabase.from("idempotency_keys").upsert(
    {
      idempotency_key: key,
      request_path: context,
      company_id: companyId,
      response_body: responseBody,
      response_code: status,
    },
    { onConflict: "idempotency_key,company_id,request_path" },
  );

  if (error) {
    console.error("[idempotency] record error:", error.message);
  }
}
