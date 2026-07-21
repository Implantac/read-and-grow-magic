
CREATE OR REPLACE VIEW public.commercial_client_profiles
WITH (security_invoker = true) AS
WITH order_stats AS (
  SELECT
    o.company_id,
    o.client_id,
    COUNT(*)::int AS total_orders,
    COALESCE(SUM(o.total), 0)::numeric AS ltv,
    COALESCE(AVG(o.total), 0)::numeric AS avg_ticket,
    MAX(o.date) AS last_order_date,
    MIN(o.date) AS first_order_date
  FROM public.orders o
  WHERE o.client_id IS NOT NULL
    AND o.status NOT IN ('cancelled','canceled','rejected')
  GROUP BY o.company_id, o.client_id
)
SELECT
  c.id AS client_id,
  c.company_id,
  c.code,
  c.name,
  c.document,
  c.segment,
  c.region,
  c.sales_rep_id,
  c.status,
  COALESCE(os.total_orders, 0) AS total_orders,
  COALESCE(os.ltv, 0)::numeric(14,2) AS ltv,
  COALESCE(os.avg_ticket, 0)::numeric(14,2) AS avg_ticket,
  os.first_order_date,
  os.last_order_date,
  CASE
    WHEN os.last_order_date IS NULL THEN NULL
    ELSE EXTRACT(day FROM (now() - os.last_order_date))::int
  END AS days_since_last_order,
  CASE
    WHEN os.first_order_date IS NULL OR os.total_orders IS NULL OR os.total_orders < 2 THEN 0
    ELSE ROUND(
      os.total_orders::numeric
      / GREATEST(1, EXTRACT(day FROM (COALESCE(os.last_order_date, now()) - os.first_order_date))::numeric / 30.0)
    , 2)
  END AS orders_per_month,
  CASE
    WHEN COALESCE(os.ltv, 0) >= 100000 THEN 'diamante'
    WHEN COALESCE(os.ltv, 0) >= 25000  THEN 'ouro'
    WHEN COALESCE(os.ltv, 0) >= 5000   THEN 'prata'
    ELSE 'bronze'
  END AS tier,
  CASE
    WHEN os.last_order_date IS NULL THEN 'sem_compras'
    WHEN os.last_order_date > (now() - INTERVAL '60 days')  THEN 'ativo'
    WHEN os.last_order_date > (now() - INTERVAL '120 days') THEN 'em_risco'
    ELSE 'inativo'
  END AS lifecycle_status
FROM public.clients c
LEFT JOIN order_stats os
  ON os.client_id = c.id AND os.company_id = c.company_id;

GRANT SELECT ON public.commercial_client_profiles TO authenticated;
GRANT SELECT ON public.commercial_client_profiles TO service_role;

COMMENT ON VIEW public.commercial_client_profiles IS
  'Perfil comercial consolidado por cliente: LTV, tier, ciclo de vida e frequência. Segurança via security_invoker (herda RLS de clients/orders).';
