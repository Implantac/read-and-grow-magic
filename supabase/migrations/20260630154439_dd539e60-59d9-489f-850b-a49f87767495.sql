-- LGPD: consent log + data subject requests
CREATE TABLE public.lgpd_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms', 'privacy', 'marketing', 'cookies', 'data_processing')),
  version TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT true,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.lgpd_consents TO authenticated;
GRANT ALL ON public.lgpd_consents TO service_role;
ALTER TABLE public.lgpd_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lgpd_consents_owner_read" ON public.lgpd_consents
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "lgpd_consents_owner_insert" ON public.lgpd_consents
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_lgpd_consents_user ON public.lgpd_consents(user_id, consent_type, created_at DESC);

CREATE TABLE public.lgpd_data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete', 'rectify', 'portability')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  payload JSONB,
  result_url TEXT,
  rejection_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT ON public.lgpd_data_requests TO authenticated;
GRANT ALL ON public.lgpd_data_requests TO service_role;
ALTER TABLE public.lgpd_data_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lgpd_requests_owner_read" ON public.lgpd_data_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "lgpd_requests_owner_insert" ON public.lgpd_data_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE INDEX idx_lgpd_requests_user ON public.lgpd_data_requests(user_id, requested_at DESC);

-- 2FA enforcement preference per company
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS require_2fa BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_retention_days INTEGER NOT NULL DEFAULT 1825;

-- Soft delete marker on profiles (preserves FK integrity, masks PII)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ;