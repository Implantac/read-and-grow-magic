-- FASE 2: Hardening RLS para Módulos Fiscais
-- Removendo políticas permissivas (USING true) e aplicando isolamento por company_id

DO $$ 
BEGIN
    -- NFe
    DROP POLICY IF EXISTS "Auth users can read nfe" ON public.nfe;
    DROP POLICY IF EXISTS "Auth users can insert nfe" ON public.nfe;
    DROP POLICY IF EXISTS "Auth users can update nfe" ON public.nfe;
    DROP POLICY IF EXISTS "Auth users can delete nfe" ON public.nfe;
    
    -- NFCe
    DROP POLICY IF EXISTS "Auth users can read nfce" ON public.nfce;
    DROP POLICY IF EXISTS "Auth users can insert nfce" ON public.nfce;
    DROP POLICY IF EXISTS "Auth users can update nfce" ON public.nfce;
    DROP POLICY IF EXISTS "Auth users can delete nfce" ON public.nfce;

    -- Fiscal Reports
    DROP POLICY IF EXISTS "Auth users can read fiscal_reports" ON public.fiscal_reports;
    DROP POLICY IF EXISTS "Auth users can insert fiscal_reports" ON public.fiscal_reports;
    DROP POLICY IF EXISTS "Auth users can update fiscal_reports" ON public.fiscal_reports;
    DROP POLICY IF EXISTS "Auth users can delete fiscal_reports" ON public.fiscal_reports;
END $$;

-- Novas Políticas Robustas

-- NFe
CREATE POLICY "NFe isolated by company" ON public.nfe 
FOR ALL TO authenticated 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- NFe Items (Isolamento via join ou company_id se existir)
CREATE POLICY "NFe items isolated by company" ON public.nfe_items
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.nfe WHERE nfe.id = nfe_items.nfe_id AND nfe.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())));

-- NFCe
CREATE POLICY "NFCe isolated by company" ON public.nfce
FOR ALL TO authenticated
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- NFCe Items
CREATE POLICY "NFCe items isolated by company" ON public.nfce_items
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.nfce WHERE nfce.id = nfce_items.nfce_id AND nfce.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())));

-- Fiscal Reports
CREATE POLICY "Fiscal reports isolated by company" ON public.fiscal_reports
FOR ALL TO authenticated
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Fiscal Tax Rules
CREATE POLICY "Tax rules isolated by company" ON public.tax_rules
FOR ALL TO authenticated
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
