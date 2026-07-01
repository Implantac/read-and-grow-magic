-- Sprint 17: cron do burn scan (5 min)
-- Idempotente: remove job antigo se existir
select cron.unschedule('sre-slo-burn-scan-5min')
where exists (select 1 from cron.job where jobname = 'sre-slo-burn-scan-5min');

select cron.schedule(
  'sre-slo-burn-scan-5min',
  '*/5 * * * *',
  $$ select public.sre_slo_burn_scan(); $$
);