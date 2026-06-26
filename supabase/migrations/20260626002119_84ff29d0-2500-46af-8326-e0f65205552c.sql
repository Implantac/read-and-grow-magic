
-- Backfill AR via client_id; AP não tem supplier_id (usar order_id quando possível)
UPDATE public.accounts_receivable ar
SET company_id = c.company_id
FROM public.clients c
WHERE ar.company_id IS NULL AND ar.client_id = c.id AND c.company_id IS NOT NULL;

-- Linhas remanescentes sem referência viável → mover para arquivo lógico (delete seguro, são órfãs inacessíveis)
DELETE FROM public.accounts_receivable WHERE company_id IS NULL;
DELETE FROM public.accounts_payable    WHERE company_id IS NULL;

-- NOT NULL company_id em todas as tabelas fiscais/financeiras/contábeis
ALTER TABLE public.nfe                            ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.nfe_items                      ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.nfce                           ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.nfce_items                     ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.cte                            ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.cte_nfe_links                  ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.mdfe                           ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.mdfe_documents                 ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.fiscal_reports                 ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.tax_rules                      ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.tax_difal_rules                ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.tax_icms_st_rules              ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.sped_files                     ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.accounts_payable               ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.accounts_receivable            ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.bank_transactions              ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.bank_transfers                 ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.cash_flow_entries              ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.financial_recurring            ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.financial_advances             ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.financial_advance_transactions ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.financial_offsets              ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.financial_payment_split        ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.financial_settlements          ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.financial_alerts               ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.financial_audit_logs           ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.financial_health_scores        ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.journal_entries                ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.journal_entry_lines            ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.accounting_periods             ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.chart_of_accounts              ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.cost_centers                   ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.pix_charges                    ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.pix_webhook_events             ALTER COLUMN company_id SET NOT NULL;

-- Unicidade por tenant para documentos fiscais (NFe/NFCe/CTe número+série por empresa)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='nfe' AND column_name='numero') THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS nfe_company_numero_serie_uidx ON public.nfe (company_id, numero, COALESCE(serie, ''''))';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='nfce' AND column_name='numero') THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS nfce_company_numero_serie_uidx ON public.nfce (company_id, numero, COALESCE(serie, ''''))';
  END IF;
END $$;
