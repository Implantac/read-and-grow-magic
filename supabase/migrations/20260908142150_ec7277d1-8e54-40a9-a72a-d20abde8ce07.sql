DROP POLICY IF EXISTS "Users can read workflow logs for their company" ON public.stock_transfer_workflow_logs;

CREATE POLICY "Users can read workflow logs for their company"
ON public.stock_transfer_workflow_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stock_transfer_orders sto
    WHERE sto.id = stock_transfer_workflow_logs.transfer_id
      AND sto.company_id = public.get_user_company_id(auth.uid())
  )
);