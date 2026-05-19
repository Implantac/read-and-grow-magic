import { assertEquals } from "https://deno.land/std@0.131.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Use environment variables provided by the test runner if possible, or fall back to known config
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://arcuhqdiydlvekanychw.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.test("deleted_orders_archive cleanup trigger - remove old then check", async () => {
  if (!supabaseKey) {
    console.log("SKIP: SUPABASE_SERVICE_ROLE_KEY not available, skipping test execution.");
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

Deno.test("deleted_orders_archive cleanup trigger - direct cleanup on insert", async () => {
  if (!supabaseKey) {
    console.log("SKIP: SUPABASE_SERVICE_ROLE_KEY not available, skipping test execution.");
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Insert a record that is already expired
  const oldId = "22222222-2222-2222-2222-222222222222";
  await supabase.from("deleted_orders_archive").insert({
    original_order_id: oldId,
    order_data: { test: "old" },
    expires_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  });

  const nextId = "33333333-3333-3333-3333-333333333333";
  await supabase.from("deleted_orders_archive").insert({
    original_order_id: nextId,
    order_data: { test: "next" },
    expires_at: new Date(Date.now() + 600000).toISOString(),
  });

  const { data: records } = await supabase
    .from("deleted_orders_archive")
    .select("original_order_id");

  const ids = records?.map(r => r.original_order_id) || [];
  assertEquals(ids.includes(oldId), false, "Older expired record should have been removed");
  assertEquals(ids.includes(nextId), true, "New record should exist");

  // Cleanup
  await supabase.from("deleted_orders_archive").delete().eq("original_order_id", nextId);
});

Deno.test("deleted_orders_archive cleanup trigger - remove multiple expired records", async () => {
  if (!supabaseKey) {
    console.log("SKIP: SUPABASE_SERVICE_ROLE_KEY not available, skipping test execution.");
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Insert multiple expired records
  const expiredIds = [
    "44444444-4444-4444-4444-444444444444",
    "55555555-5555-5555-5555-555555555555",
    "66666666-6666-6666-6666-666666666666"
  ];
  
  const expiredEntries = expiredIds.map(id => ({
    original_order_id: id,
    order_data: { test: "multiple_expired" },
    expires_at: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
  }));

  const { error: insertExpiredError } = await supabase
    .from("deleted_orders_archive")
    .insert(expiredEntries);

  if (insertExpiredError) throw insertExpiredError;

  // 2. Insert one fresh record to trigger cleanup of ALL expired records
  const freshId = "77777777-7777-7777-7777-777777777777";
  const { error: insertFreshError } = await supabase
    .from("deleted_orders_archive")
    .insert({
      original_order_id: freshId,
      order_data: { test: "trigger_all" },
      expires_at: new Date(Date.now() + 600000).toISOString(),
    });

  if (insertFreshError) throw insertFreshError;

  // 3. Verify all expired records are gone
  const { data: remainingExpired } = await supabase
    .from("deleted_orders_archive")
    .select("original_order_id")
    .in("original_order_id", expiredIds);

  assertEquals(remainingExpired?.length, 0, "All multiple expired records should have been removed");

  // 4. Verify fresh record still exists
  const { data: freshRecord } = await supabase
    .from("deleted_orders_archive")
    .select("id")
    .eq("original_order_id", freshId);

  assertEquals(freshRecord?.length, 1, "Fresh record should still exist");

  // Cleanup
  await supabase.from("deleted_orders_archive").delete().eq("original_order_id", freshId);
});

Deno.test("deleted_orders_archive cleanup trigger - remove only expired among mixed records", async () => {
  if (!supabaseKey) {
    console.log("SKIP: SUPABASE_SERVICE_ROLE_KEY not available, skipping test execution.");
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Setup mixed existing records
  const expiredId = "88888888-8888-8888-8888-888888888888";
  const validId = "99999999-9999-9999-9999-999999999999";
  
  await supabase.from("deleted_orders_archive").insert([
    {
      original_order_id: expiredId,
      order_data: { test: "mixed_expired" },
      expires_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    },
    {
      original_order_id: validId,
      order_data: { test: "mixed_valid" },
      expires_at: new Date(Date.now() + 300000).toISOString(), // 5 minutes from now
    }
  ]);

  // 2. Trigger cleanup with a new insert
  const triggerId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  await supabase.from("deleted_orders_archive").insert({
    original_order_id: triggerId,
    order_data: { test: "mixed_trigger" },
    expires_at: new Date(Date.now() + 600000).toISOString(),
  });

  // 3. Verify
  const { data: records } = await supabase
    .from("deleted_orders_archive")
    .select("original_order_id")
    .in("original_order_id", [expiredId, validId, triggerId]);

  const ids = records?.map(r => r.original_order_id) || [];
  
  assertEquals(ids.includes(expiredId), false, "Expired record should have been removed");
  assertEquals(ids.includes(validId), true, "Valid record should still exist");
  assertEquals(ids.includes(triggerId), true, "Triggering record should exist");

  // Cleanup
  await supabase.from("deleted_orders_archive").delete().in("original_order_id", [validId, triggerId]);
});
