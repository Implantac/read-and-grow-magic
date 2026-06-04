-- Contabilidade Enterprise
CREATE TABLE public.accounting_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- Asset, Liability, Revenue, Expense
    level INTEGER NOT NULL,
    parent_id UUID REFERENCES public.accounting_accounts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.accounting_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    reference_id UUID,
    reference_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.accounting_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES public.accounting_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounting_accounts(id),
    amount DECIMAL(15,2) NOT NULL,
    type TEXT NOT NULL, -- Debit, Credit
    cost_center_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_items TO authenticated;

GRANT ALL ON public.accounting_accounts TO service_role;
GRANT ALL ON public.accounting_entries TO service_role;
GRANT ALL ON public.accounting_items TO service_role;

-- RLS
ALTER TABLE public.accounting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access accounting data of their company" ON public.accounting_accounts FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can access entries data of their company" ON public.accounting_entries FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
