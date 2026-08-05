-- Revogar acesso público a funções sensíveis (SEC-DB)
REVOKE ALL ON FUNCTION public.batch_pay_payables(uuid[], uuid, text, date, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transfer_between_accounts(uuid, uuid, numeric, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.settle_account(text, uuid, jsonb, date, numeric, numeric, numeric, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reverse_settlement(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.compensate_check(uuid, uuid, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_credit(uuid, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.evaluate_transaction_risk(numeric, text, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_matriz_viewer(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_access_company(uuid) FROM PUBLIC;

-- Garantir acesso apenas a usuários autenticados e service_role
GRANT EXECUTE ON FUNCTION public.batch_pay_payables(uuid[], uuid, text, date, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.transfer_between_accounts(uuid, uuid, numeric, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.settle_account(text, uuid, jsonb, date, numeric, numeric, numeric, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reverse_settlement(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.compensate_check(uuid, uuid, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_credit(uuid, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.evaluate_transaction_risk(numeric, text, uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_matriz_viewer(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_company(uuid) TO authenticated, service_role;

-- Manter handle_new_user acessível apenas por service_role (trigger interna)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
