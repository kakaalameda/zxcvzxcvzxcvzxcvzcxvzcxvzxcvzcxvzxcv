create table if not exists public.shipping_api_configs (
  provider text primary key,
  base_url text not null,
  api_token text not null,
  client_source text not null,
  pick_name text not null,
  pick_address_id text,
  pick_address text not null,
  pick_province text not null,
  pick_district text not null,
  pick_ward text,
  pick_tel text not null,
  transport text not null default 'road' check (transport in ('road', 'fly')),
  default_product_weight numeric(10, 3) not null default 0.2 check (default_product_weight > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.shipping_api_configs enable row level security;

drop policy if exists "Authenticated can manage shipping api configs" on public.shipping_api_configs;
create policy "Authenticated can manage shipping api configs"
on public.shipping_api_configs for all
to authenticated
using (true)
with check (true);
