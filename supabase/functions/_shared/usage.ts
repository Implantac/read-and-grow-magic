// Centralized usage metering helper. Records a billing event via the
// `record_usage` RPC (service-role only). Never throws — metering failures
// must not break the caller's primary action.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

let _admin: ReturnType<typeof createClient> | null = null;
function admin() {
  if (_admin) return _admin;
  _admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  return _admin;
}

export async function recordUsage(
  companyId: string | null | undefined,
  meterKey: "ai_call" | "nfe_issued" | "plugin_execution" | "workflow_execution",
  quantity = 1,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  if (!companyId) return;
  try {
    const { error } = await admin().rpc("record_usage", {
      _company_id: companyId,
      _meter_key: meterKey,
      _quantity: quantity,
      _metadata: metadata,
    });
    if (error) console.error("[recordUsage]", meterKey, error.message);
  } catch (e) {
    console.error("[recordUsage] threw", meterKey, (e as Error).message);
  }
}
