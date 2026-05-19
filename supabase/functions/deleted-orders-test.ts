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

Deno.test("deleted_orders_archive cleanup trigger - exactly now boundary", async () => {
  if (!supabaseKey) {
    console.log("SKIP: SUPABASE_SERVICE_ROLE_KEY not available, skipping test execution.");
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Insert a record with expires_at set to a timestamp that will definitely be past
  // by the time the next insert happens.
  const boundaryId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  const now = new Date().toISOString();
  
  await supabase.from("deleted_orders_archive").insert({
    original_order_id: boundaryId,
    order_data: { test: "boundary" },
    expires_at: now,
  });

  // 2. Trigger cleanup
  const triggerId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
  await supabase.from("deleted_orders_archive").insert({
    original_order_id: triggerId,
    order_data: { test: "boundary_trigger" },
    expires_at: new Date(Date.now() + 600000).toISOString(),
  });

  // 3. Verify
  // Since the trigger uses `expires_at < now()`, if the boundary record was inserted with a timestamp
  // that is now in the past (even by a few ms), it should be gone.
  const { data: records } = await supabase
    .from("deleted_orders_archive")
    .select("original_order_id")
    .eq("original_order_id", boundaryId);

  // Note: 'now()' in Postgres is the transaction start time. 
  // In most cases, a record with exactly the same timestamp as a previous 'now()' 
  // will be removed if the new 'now()' is later.
  console.log(`Boundary record with expires_at ${now} was ${records?.length === 0 ? 'removed' : 'preserved'}`);

  // Cleanup
  await supabase.from("deleted_orders_archive").delete().eq("original_order_id", triggerId);
});

Deno.test("deleted_orders_archive cleanup trigger - remove record with expires_at just in the past", async () => {
  if (!supabaseKey) {
    console.log("SKIP: SUPABASE_SERVICE_ROLE_KEY not available, skipping test execution.");
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Insert a record with expires_at slightly in the past (e.g., 100ms ago)
  const pastId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
  const slightlyPast = new Date(Date.now() - 100).toISOString();
  
  await supabase.from("deleted_orders_archive").insert({
    original_order_id: pastId,
    order_data: { test: "slightly_past" },
    expires_at: slightlyPast,
  });

  // 2. Trigger cleanup
  const triggerId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
  await supabase.from("deleted_orders_archive").insert({
    original_order_id: triggerId,
    order_data: { test: "past_trigger" },
    expires_at: new Date(Date.now() + 600000).toISOString(),
  });

  // 3. Verify it was removed
  const { data: records } = await supabase
    .from("deleted_orders_archive")
    .select("original_order_id")
    .eq("original_order_id", pastId);

  assertEquals(records?.length, 0, "Record with expires_at just in the past should have been removed");

  // Cleanup
  await supabase.from("deleted_orders_archive").delete().eq("original_order_id", triggerId);
});

Deno.test("deleted_orders_archive cleanup trigger - preserve record set slightly in the future", async () => {
  if (!supabaseKey) {
    console.log("SKIP: SUPABASE_SERVICE_ROLE_KEY not available, skipping test execution.");
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Insert a record with expires_at set to 2 seconds in the future
  const futureId = "ffffffff-ffff-ffff-ffff-ffffffffffff";
  const slightlyFuture = new Date(Date.now() + 2000).toISOString();
  
  await supabase.from("deleted_orders_archive").insert({
    original_order_id: futureId,
    order_data: { test: "slightly_future" },
    expires_at: slightlyFuture,
  });

  // 2. Trigger cleanup immediately
  const triggerId = "00000000-1111-2222-3333-444444444444";
  await supabase.from("deleted_orders_archive").insert({
    original_order_id: triggerId,
    order_data: { test: "future_trigger" },
    expires_at: new Date(Date.now() + 600000).toISOString(),
  });

  // 3. Verify it is preserved because it hasn't expired yet
  const { data: records } = await supabase
    .from("deleted_orders_archive")
    .select("original_order_id")
    .eq("original_order_id", futureId);

  assertEquals(records?.length, 1, "Record with expires_at in the future should be preserved");

  // Cleanup
  await supabase.from("deleted_orders_archive").delete().in("original_order_id", [futureId, triggerId]);
});

Deno.test("deleted_orders_archive cleanup trigger - precise current timestamp boundary", async () => {
  if (!supabaseKey) {
    console.log("SKIP: SUPABASE_SERVICE_ROLE_KEY not available, skipping test execution.");
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Insert a record with expires_at set to 'now' + 500ms 
  // to ensure it is considered 'future' when the trigger runs immediately after.
  const preciseId = "12345678-1234-1234-1234-123456789012";
  const nowPlusTiny = new Date(Date.now() + 500).toISOString();
  
  await supabase.from("deleted_orders_archive").insert({
    original_order_id: preciseId,
    order_data: { test: "precise_boundary" },
    expires_at: nowPlusTiny,
  });

  // 2. Trigger cleanup immediately
  const triggerId = "fedcba98-7654-3210-fedc-ba9876543210";
  await supabase.from("deleted_orders_archive").insert({
    original_order_id: triggerId,
    order_data: { test: "precise_trigger" },
    expires_at: new Date(Date.now() + 600000).toISOString(),
  });

  // 3. Verify it is preserved
  const { data: records } = await supabase
    .from("deleted_orders_archive")
    .select("original_order_id")
    .eq("original_order_id", preciseId);

  assertEquals(records?.length, 1, "Record with expires_at slightly in the future (boundary) should be preserved");

  // Cleanup
  await supabase.from("deleted_orders_archive").delete().in("original_order_id", [preciseId, triggerId]);
});

Deno.test("deleted_orders_archive cleanup trigger - millisecond truncation boundary", async () => {
  if (!supabaseKey) {
    console.log("SKIP: SUPABASE_SERVICE_ROLE_KEY not available, skipping test execution.");
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Insert a record with expires_at set to exactly 'now' truncated to seconds
  // This helps test behavior when milliseconds are zeroed out
  const truncatedId = "aaaabbbb-cccc-dddd-eeee-ffff00001111";
  const now = new Date();
  now.setMilliseconds(0);
  const truncatedTimestamp = now.toISOString();
  
  await supabase.from("deleted_orders_archive").insert({
    original_order_id: truncatedId,
    order_data: { test: "truncated_boundary" },
    expires_at: truncatedTimestamp,
  });

  // 2. Wait a tiny bit to ensure Postgres 'now()' will be greater
  await new Promise(resolve => setTimeout(resolve, 50));

  // 3. Trigger cleanup
  const triggerId = "11112222-3333-4444-5555-666677778888";
  await supabase.from("deleted_orders_archive").insert({
    original_order_id: triggerId,
    order_data: { test: "truncated_trigger" },
    expires_at: new Date(Date.now() + 600000).toISOString(),
  });

  // 4. Verify - Since expires_at was set to a point that is now in the past (even if truncated),
  // it should be removed by the `expires_at < now()` condition.
  const { data: records } = await supabase
    .from("deleted_orders_archive")
    .select("original_order_id")
    .eq("original_order_id", truncatedId);

  assertEquals(records?.length, 0, \"Truncated timestamp (past) should have been removed by trigger\");

  // Cleanup
  await supabase.from(\"deleted_orders_archive\").delete().eq(\"original_order_id\", triggerId);
});

Deno.test(\"deleted_orders_archive cleanup trigger - timezone offset consistency\", async () => {
  if (!supabaseKey) {
    console.log(\"SKIP: SUPABASE_SERVICE_ROLE_KEY not available, skipping test execution.\");
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Record in the past with a positive offset (+05:00)
  // Current time in UTC - 1 hour, expressed with +05:00 offset
  const pastTime = new Date(Date.now() - 3600000); 
  // Manual offset string construction to ensure precise test of database offset parsing
  // We use a date in the past and manually set an offset
  const pastOffsetStr = \"2020-01-01T00:00:00+05:00\"; // Definitely in the past
  const pastOffsetId = \"abc12345-0000-0000-0000-000000000000\";

  // 2. Record in the future with a negative offset (-05:00)
  // Definitely in the future
  const futureOffsetStr = \"2099-01-01T00:00:00-05:00\";
  const futureOffsetId = \"def67890-0000-0000-0000-000000000000\";

  const { error: insertError } = await supabase.from(\"deleted_orders_archive\").insert([
    {
      original_order_id: pastOffsetId,
      order_data: { test: \"past_offset\" },
      expires_at: pastOffsetStr,
    },
    {
      original_order_id: futureOffsetId,
      order_data: { test: \"future_offset\" },
      expires_at: futureOffsetStr,
    }
  ]);

  if (insertError) throw insertError;

  // 3. Trigger cleanup
  const triggerId = \"11111111-2222-3333-4444-555555555555\";
  await supabase.from(\"deleted_orders_archive\").insert({
    original_order_id: triggerId,
    order_data: { test: \"timezone_trigger\" },
    expires_at: new Date(Date.now() + 600000).toISOString(),
  });

  // 4. Verify
  const { data: records } = await supabase
    .from(\"deleted_orders_archive\")
    .select(\"original_order_id\")
    .in(\"original_order_id\", [pastOffsetId, futureOffsetId]);

  const ids = records?.map(r => r.original_order_id) || [];
  
  assertEquals(ids.includes(pastOffsetId), false, \"Record with past offset should have been removed\");
  assertEquals(ids.includes(futureOffsetId), true, \"Record with future offset should still exist\");

  // Cleanup
  await supabase.from(\"deleted_orders_archive\").delete().in(\"original_order_id\", [futureOffsetId, triggerId]);
});
