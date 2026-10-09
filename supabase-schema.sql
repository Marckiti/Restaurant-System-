create table if not exists public.pos_state (
  id text primary key,
  payload jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.pos_state enable row level security;

create policy if not exists "Allow all reads and writes for pos_state"
on public.pos_state
for all
using (true)
with check (true);
