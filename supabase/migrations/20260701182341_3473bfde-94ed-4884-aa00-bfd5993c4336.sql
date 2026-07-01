
CREATE OR REPLACE FUNCTION public.generate_receivable_from_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    INSERT INTO public.accounts_receivable (
      description, client_name, client_id, amount, due_date,
      status, category, invoice_number, notes, company_id
    ) VALUES (
      'Venda ' || NEW.number, NEW.client_name, NEW.client_id, NEW.total,
      (now() + interval '30 days'), 'pending', 'Vendas',
      NEW.number, 'Gerado automaticamente da venda ' || NEW.number, NEW.company_id
    );
  END IF;
  RETURN NEW;
END;
$$;
