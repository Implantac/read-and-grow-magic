-- FASE 10: Atomicidade de Transações Financeiras/Fiscais
-- Garante que operações complexas ocorram em transação única ou com integridade forçada via triggers.

-- 1. Atomicidade no Faturamento (NF-e -> Financeiro -> Estoque)
CREATE OR REPLACE FUNCTION public.process_invoice_atomic(
    p_company_id UUID,
    p_sale_id UUID,
    p_items JSONB, -- Array de itens [{product_id, quantity, price, cost}]
    p_financial JSONB, -- Dados para o financeiro [{due_date, amount, bank_account_id}]
    p_fiscal_payload JSONB -- Dados para a NF-e
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_nfe_id UUID;
    v_item RECORD;
    v_fin RECORD;
    v_result JSONB;
BEGIN
    -- 1. Criar NF-e (Status: draft)
    INSERT INTO public.fiscal_invoices (
        company_id, sale_id, payload, status, issue_date
    ) VALUES (
        p_company_id, p_sale_id, p_fiscal_payload, 'draft', now()
    ) RETURNING id INTO v_nfe_id;

    -- 2. Processar Itens (Estoque)
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity NUMERIC, price NUMERIC, cost NUMERIC)
    LOOP
        INSERT INTO public.stock_movements (
            company_id, product_id, quantity, type, origin_type, origin_id, unit_price, cost_price
        ) VALUES (
            p_company_id, v_item.product_id, -v_item.quantity, 'out', 'sale', p_sale_id, v_item.price, v_item.cost
        );
    END LOOP;

    -- 3. Processar Financeiro (Contas a Receber)
    FOR v_fin IN SELECT * FROM jsonb_to_recordset(p_financial) AS x(due_date DATE, amount NUMERIC, bank_account_id UUID)
    LOOP
        INSERT INTO public.accounts_receivable (
            company_id, nfe_id, sale_id, due_date, amount, balance, status, bank_account_id
        ) VALUES (
            p_company_id, v_nfe_id, p_sale_id, v_fin.due_date, v_fin.amount, v_fin.amount, 'pending', v_fin.bank_account_id
        );
    END LOOP;

    v_result := jsonb_build_object(
        'success', true,
        'nfe_id', v_nfe_id,
        'message', 'Faturamento processado com atomicidade.'
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.process_invoice_atomic(UUID, UUID, JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_invoice_atomic(UUID, UUID, JSONB, JSONB, JSONB) TO service_role;

-- 2. Integridade de Pagamentos
CREATE OR REPLACE FUNCTION public.sync_payment_to_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Atualizar saldo da conta bancária
    IF NEW.bank_account_id IS NOT NULL THEN
        UPDATE public.bank_accounts
        SET balance = balance + (CASE WHEN NEW.receivable_id IS NOT NULL THEN NEW.total_paid ELSE -NEW.total_paid END)
        WHERE id = NEW.bank_account_id AND company_id = NEW.company_id;
    END IF;

    -- Atualizar saldo do título
    IF NEW.receivable_id IS NOT NULL THEN
        UPDATE public.accounts_receivable
        SET balance = balance - NEW.total_paid,
            status = CASE WHEN (balance - NEW.total_paid) <= 0 THEN 'paid' ELSE 'partial' END
        WHERE id = NEW.receivable_id AND company_id = NEW.company_id;
    ELSIF NEW.payable_id IS NOT NULL THEN
        UPDATE public.accounts_payable
        SET balance = balance - NEW.total_paid,
            status = CASE WHEN (balance - NEW.total_paid) <= 0 THEN 'paid' ELSE 'partial' END
        WHERE id = NEW.payable_id AND company_id = NEW.company_id;
    END IF;

    -- Registrar no Razão
    INSERT INTO public.financial_ledger (
        company_id, bank_account_id, amount, type, origin_type, origin_id, description, entry_date
    ) VALUES (
        NEW.company_id, 
        NEW.bank_account_id, 
        NEW.total_paid,
        CASE WHEN NEW.receivable_id IS NOT NULL THEN 'credit' ELSE 'debit' END,
        'payment',
        NEW.id,
        COALESCE(NEW.notes, 'Pagamento registrado'),
        NEW.payment_date
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_payment_to_ledger ON public.payment_records;
CREATE TRIGGER trg_sync_payment_to_ledger
AFTER INSERT ON public.payment_records
FOR EACH ROW EXECUTE FUNCTION public.sync_payment_to_ledger();
