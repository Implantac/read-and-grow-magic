create table public.oee_metrics (
    id uuid primary key default gen_random_uuid(),
    company_id uuid references public.companies(id) on delete cascade not null,
    branch_id uuid references public.branches(id) on delete cascade,
    machine_id uuid references public.production_machines(id) on delete cascade,
    sector text,
    availability numeric(5,2) not null,
    performance numeric(5,2) not null,
    quality numeric(5,2) not null,
    oee numeric(5,2) not null,
    timestamp timestamptz default now() not null
);

grant select, insert on public.oee_metrics to authenticated;
grant all on public.oee_metrics to service_role;

alter table public.oee_metrics enable row level security;

create policy "Users can view their company metrics"
on public.oee_metrics
for select
to authenticated
using (company_id = (select company_id from public.profiles where id = auth.uid()));

create policy "Service role can manage all metrics"
on public.oee_metrics
for all
to service_role
using (true)
with check (true);
