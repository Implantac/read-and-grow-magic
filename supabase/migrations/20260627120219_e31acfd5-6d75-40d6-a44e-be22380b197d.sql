
CREATE TABLE IF NOT EXISTS public.plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  vendor text,
  version text NOT NULL DEFAULT '1.0.0',
  icon text,
  config_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  required_modules text[] NOT NULL DEFAULT ARRAY[]::text[],
  price_monthly numeric(12,2) NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plugins TO authenticated;
GRANT ALL ON public.plugins TO service_role;
ALTER TABLE public.plugins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plugins_read_published" ON public.plugins
  FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "plugins_service_write" ON public.plugins
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.plugin_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  plugin_id uuid NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled','uninstalled')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  installed_by uuid,
  installed_at timestamptz NOT NULL DEFAULT now(),
  uninstalled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, plugin_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_installations TO authenticated;
GRANT ALL ON public.plugin_installations TO service_role;
ALTER TABLE public.plugin_installations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pi_tenant_read" ON public.plugin_installations
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "pi_admin_write" ON public.plugin_installations
  FOR ALL TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin'::app_role, company_id)
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin'::app_role, company_id)
  );

CREATE INDEX IF NOT EXISTS idx_plugin_inst_company ON public.plugin_installations(company_id, status);

CREATE TRIGGER trg_plugins_updated_at BEFORE UPDATE ON public.plugins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_plugin_inst_updated_at BEFORE UPDATE ON public.plugin_installations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.plugins (key, name, description, category, vendor, version, required_modules, price_monthly)
VALUES
  ('whatsapp-sender','WhatsApp Sender','Envio de mensagens e notificações via WhatsApp Business','communication','Lovable','1.0.0', ARRAY['commercial']::text[], 0),
  ('open-banking-itau','Itaú Open Banking','Conciliação automática com Itaú via Open Finance','financial','Lovable','1.0.0', ARRAY['financial']::text[], 49),
  ('serasa-credit','Serasa Score','Consulta automática de score em análises de crédito','financial','Lovable','1.0.0', ARRAY['financial']::text[], 99),
  ('correios-tracking','Correios Tracking','Rastreio automático de envios','logistics','Lovable','1.0.0', ARRAY['operational']::text[], 0)
ON CONFLICT (key) DO NOTHING;
