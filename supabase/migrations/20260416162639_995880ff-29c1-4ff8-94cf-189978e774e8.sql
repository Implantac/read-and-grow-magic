
-- Remove the insecure anon INSERT policy
DROP POLICY IF EXISTS "Anon can insert rfid_events" ON public.rfid_events;

-- Add authenticated-only INSERT policy
CREATE POLICY "Authenticated users can insert rfid_events"
ON public.rfid_events
FOR INSERT TO authenticated
WITH CHECK (true);
