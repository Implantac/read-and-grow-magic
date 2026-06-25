
-- 1. custom_entities
CREATE TABLE public.custom_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_key text NOT NULL,
  label text NOT NULL,
  label_plural text,
  description text,
  icon text,
  module_key text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE (company_id, entity_key),
  CONSTRAINT custom_entities_key_format CHECK (entity_key ~ '^[a-z][a-z0-9_]{1,60}$')
);
CREATE INDEX idx_custom_entities_company ON public.custom_entities(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_entities TO authenticated;
GRANT ALL ON public.custom_entities TO service_role;

ALTER TABLE public.custom_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_entities_read_same_company" ON public.custom_entities
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "custom_entities_admin_write" ON public.custom_entities
  FOR ALL TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'manager'::app_role)
    )
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'manager'::app_role)
    )
  );

-- 2. custom_fields
CREATE TABLE public.custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL REFERENCES public.custom_entities(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  is_unique boolean NOT NULL DEFAULT false,
  default_value jsonb,
  options jsonb,             -- para select/multiselect: [{value,label}]
  reference_entity text,     -- para field_type='reference'
  validation jsonb,          -- regex, min, max, etc.
  help_text text,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE (entity_id, field_key),
  CONSTRAINT custom_fields_key_format CHECK (field_key ~ '^[a-z][a-z0-9_]{1,60}$'),
  CONSTRAINT custom_fields_type_allowed CHECK (field_type IN (
    'text','textarea','number','integer','date','datetime',
    'boolean','select','multiselect','json','reference','email','url','phone','currency'
  ))
);
CREATE INDEX idx_custom_fields_entity ON public.custom_fields(entity_id, display_order);
CREATE INDEX idx_custom_fields_company ON public.custom_fields(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_fields TO authenticated;
GRANT ALL ON public.custom_fields TO service_role;

ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_fields_read_same_company" ON public.custom_fields
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "custom_fields_admin_write" ON public.custom_fields
  FOR ALL TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'manager'::app_role)
    )
  )
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'manager'::app_role)
    )
  );

-- 3. updated_at triggers (reuse generic helper if exists, else create one)
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_custom_entities_updated_at
  BEFORE UPDATE ON public.custom_entities
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER trg_custom_fields_updated_at
  BEFORE UPDATE ON public.custom_fields
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
