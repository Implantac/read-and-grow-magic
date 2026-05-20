-- Create table for AI prompt audit logs
CREATE TABLE IF NOT EXISTS public.ai_prompt_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    function_name TEXT NOT NULL,
    persona TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    metadata JSONB,
    user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.ai_prompt_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view audit logs" 
ON public.ai_prompt_audit_logs FOR SELECT 
TO authenticated 
USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_audit_timestamp ON public.ai_prompt_audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_function ON public.ai_prompt_audit_logs (function_name);