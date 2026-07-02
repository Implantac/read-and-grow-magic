ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS estimated_cost numeric(14,2),
  ADD COLUMN IF NOT EXISTS estimated_tax numeric(14,2),
  ADD COLUMN IF NOT EXISTS estimated_margin_pct numeric(6,2);

COMMENT ON COLUMN public.orders.estimated_cost IS 'Custo estimado (CMV) calculado no momento da criação do pedido.';
COMMENT ON COLUMN public.orders.estimated_tax IS 'Impostos estimados (ICMS+PIS+COFINS) no momento da criação.';
COMMENT ON COLUMN public.orders.estimated_margin_pct IS 'Margem líquida estimada (%) no momento da criação.';