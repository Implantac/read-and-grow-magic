
-- Enable RLS on realtime.messages
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow only authenticated users to read realtime messages
CREATE POLICY "Authenticated users can read realtime messages"
ON realtime.messages
FOR SELECT TO authenticated
USING (true);

-- Deny all writes from non-service roles (messages are system-generated)
CREATE POLICY "No direct insert on realtime messages"
ON realtime.messages
FOR INSERT TO authenticated
WITH CHECK (false);
