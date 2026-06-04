-- Ajustar search_path para segurança
ALTER FUNCTION public.fn_setup_new_company_fiscal() SET search_path = public;

-- Revogar execução pública (será executada por trigger/service_role)
REVOKE EXECUTE ON FUNCTION public.fn_setup_new_company_fiscal() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_setup_new_company_fiscal() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_setup_new_company_fiscal() FROM anon;

-- Habilitar RLS na tabela de referência
ALTER TABLE public.fiscal_cfop_reference ENABLE ROW LEVEL SECURITY;

-- Política para leitura (todos usuários autenticados podem ver os CFOPs disponíveis)
CREATE POLICY "Allow read access to authenticated users"
ON public.fiscal_cfop_reference
FOR SELECT
TO authenticated
USING (true);
