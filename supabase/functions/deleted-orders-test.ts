import { assertEquals } from "https://deno.land/std@0.131.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Use environment variables provided by the test runner if possible, or fall back to known config
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://arcuhqdiydlvekanychw.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.test("deleted_orders_archive cleanup trigger", async () => {
  if (!supabaseKey) {
    console.warn("Skipping test: SUPABASE_SERVICE_ROLE_KEY not set");
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Insert an expired record
  const expiredId = "00000000-0000-0000-0000-000000000000";
  const { error: insertExpiredError } = await supabase
    .from("deleted_orders_archive")
    .insert({
      original_order_id: expiredId,
      order_data: { test: "expired" },
      expires_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
    });

  if (insertExpiredError) throw insertExpiredError;

  // 2. Insert a fresh record to trigger cleanup
  const freshId = "11111111-1111-1111-1111-111111111111";
  const { error: insertFreshError } = await supabase
    .from("deleted_orders_archive")
    .insert({
      original_order_id: freshId,
      order_data: { test: "fresh" },
      expires_at: new Date(Date.now() + 600000).toISOString(), // 10 minutes from now
    });

  if (insertFreshError) throw insertFreshError;

  // 3. Check if the expired record is gone
  const { data: expiredRecords, error: fetchExpiredError } = await supabase
    .from("deleted_orders_archive")
    .select("id")
    .eq("original_order_id", expiredId);

  if (fetchExpiredError) throw fetchExpiredError;
  assertEquals(expiredRecords?.length, 0, "Expired record should have been cleaned up by trigger");

  // 4. Check if the fresh record still exists
  const { data: freshRecords, error: fetchFreshError } = await supabase
    .from("deleted_orders_archive")
    .select("id")
    .eq("original_order_id", freshId);

  if (fetchFreshError) throw fetchFreshError;
  assertEquals(freshRecords?.length, 1, "Fresh record should still exist");

  // Cleanup fresh test record
  await supabase.from("deleted_orders_archive").delete().eq("original_order_id", freshId);
});
