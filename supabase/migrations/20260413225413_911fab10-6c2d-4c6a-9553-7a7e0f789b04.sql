
CREATE TABLE public.ai_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  module TEXT NOT NULL,
  action_name TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  context TEXT,
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_action_logs_user ON public.ai_action_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_action_logs_action ON public.ai_action_logs(user_id, module, action_name);

ALTER TABLE public.ai_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own action logs"
  ON public.ai_action_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage action logs"
  ON public.ai_action_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
