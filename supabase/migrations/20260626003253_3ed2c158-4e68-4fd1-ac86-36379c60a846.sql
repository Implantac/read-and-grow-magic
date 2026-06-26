
-- Ciclo 08: Performance indexes for hot queries identified via pg_stat_statements
CREATE INDEX IF NOT EXISTS idx_ai_brain_decisions_status_created
  ON public.ai_brain_decisions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_brain_decisions_created
  ON public.ai_brain_decisions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_brain_memory_importance
  ON public.ai_brain_memory (importance DESC);

CREATE INDEX IF NOT EXISTS idx_ai_brain_runs_created
  ON public.ai_brain_runs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clients_company_status
  ON public.clients (company_id, status);

CREATE INDEX IF NOT EXISTS idx_products_company_status
  ON public.products (company_id, status);

-- Common tenant-scoped operational tables also benefit from composite indexes
CREATE INDEX IF NOT EXISTS idx_orders_company_status_created
  ON public.orders (company_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ap_company_status_due
  ON public.accounts_payable (company_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_ar_company_status_due
  ON public.accounts_receivable (company_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_stock_movements_company_created
  ON public.stock_movements (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_company_created
  ON public.financial_ledger (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_company_created
  ON public.notifications (company_id, created_at DESC);
