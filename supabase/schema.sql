-- Tokuma — Supabase schema.
-- Mirrors src/lib/types.ts exactly, so swapping the localStorage store in
-- src/lib/store.tsx for a Supabase query changes nothing downstream.

create type project_status  as enum ('Concept','Prototype','Pilot','Scaling','Production');
create type data_confidence as enum ('measured','estimated','default');
create type user_role       as enum ('admin','project_manager','researcher','viewer');

create table profiles (
  id           uuid primary key references auth.users on delete cascade,
  name         text,
  email        text,
  role         user_role not null default 'viewer',
  organization text,
  created_at   timestamptz not null default now()
);

create table projects (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  description  text,
  cluster      text not null,
  category     text,
  organization text,
  team         text[] not null default '{}',
  status       project_status not null default 'Concept',
  confidence   data_confidence not null default 'estimated',
  accent       text,
  image_url    text,
  start_date   date,
  created_by   uuid references profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table products (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  slug        text not null,
  name        text not null,
  description text,
  end_of_life text,
  repair_notes text,
  image_url   text,
  unique (project_id, slug)
);

create table project_materials (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references projects(id) on delete cascade,
  primary_material text,
  quantity_kg      numeric not null default 0,
  recycled_pct     numeric not null default 0 check (recycled_pct between 0 and 100),
  renewable_pct    numeric not null default 0 check (renewable_pct between 0 and 100),
  bio_based_pct    numeric not null default 0 check (bio_based_pct between 0 and 100),
  reusable_pct     numeric not null default 0 check (reusable_pct between 0 and 100),
  recyclable_pct   numeric not null default 0 check (recyclable_pct between 0 and 100)
);

create table waste_metrics (
  id                     uuid primary key default gen_random_uuid(),
  project_id             uuid not null references projects(id) on delete cascade,
  total_input_kg         numeric not null default 0,
  manufacturing_waste_kg numeric not null default 0,
  reused_internally_kg   numeric not null default 0,
  recycled_externally_kg numeric not null default 0,
  landfill_kg            numeric not null default 0,
  hazardous_kg           numeric not null default 0,
  packaging_waste_kg     numeric not null default 0,
  period_start           date,
  period_end             date
);

create table lifecycle_metrics (
  id                   uuid primary key default gen_random_uuid(),
  project_id           uuid not null references projects(id) on delete cascade,
  expected_life_years  numeric not null default 0,
  repairability        numeric not null default 0 check (repairability between 0 and 100),
  modularity           numeric not null default 0 check (modularity between 0 and 100),
  reusability          numeric not null default 0 check (reusability between 0 and 100),
  remanufacturability  numeric not null default 0 check (remanufacturability between 0 and 100),
  recovery_rate_pct    numeric not null default 0 check (recovery_rate_pct between 0 and 100),
  take_back_program    boolean not null default false
);

create table financial_metrics (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references projects(id) on delete cascade,
  material_cost       numeric not null default 0,
  waste_disposal_cost numeric not null default 0,
  production_cost     numeric not null default 0,
  reuse_savings       numeric not null default 0,
  recycling_savings   numeric not null default 0,
  circular_revenue    numeric not null default 0,
  circular_investment numeric not null default 0,
  discount_rate       numeric not null default 0.10,
  horizon_years       int    not null default 7,
  is_public           boolean not null default false  -- gates the public QR page
);

create table environmental_metrics (
  id                       uuid primary key default gen_random_uuid(),
  project_id               uuid not null references projects(id) on delete cascade,
  carbon_footprint_tco2e   numeric not null default 0,
  carbon_reduction_tco2e   numeric not null default 0,
  water_usage_m3           numeric not null default 0,
  water_savings_m3         numeric not null default 0,
  energy_usage_mwh         numeric not null default 0,
  energy_savings_mwh       numeric not null default 0,
  renewable_energy_pct     numeric not null default 0 check (renewable_energy_pct between 0 and 100)
);

-- Scores are stored, not only computed, so a printed QR code can always be
-- traced back to the exact methodology version that produced its number.
create table scores (
  id                   uuid primary key default gen_random_uuid(),
  project_id           uuid not null references projects(id) on delete cascade,
  materials_score      numeric not null,
  waste_score          numeric not null,
  lifecycle_score      numeric not null,
  recovery_score       numeric not null,
  financial_score      numeric not null,
  environmental_score  numeric not null,
  overall_score        numeric not null,
  calculation_version  text not null default 'v1.0',
  computed_at          timestamptz not null default now()
);

create table score_weights (
  id       uuid primary key default gen_random_uuid(),
  version  text not null,
  pillar   text not null,
  weight   numeric not null check (weight between 0 and 1),
  unique (version, pillar)
);

insert into score_weights (version, pillar, weight) values
  ('v1.0','materials',0.20), ('v1.0','waste',0.20), ('v1.0','lifecycle',0.20),
  ('v1.0','recovery',0.15), ('v1.0','financial',0.15), ('v1.0','environmental',0.10);

create table recommendations (
  id                         uuid primary key default gen_random_uuid(),
  project_id                 uuid not null references projects(id) on delete cascade,
  title                      text not null,
  description                text,
  pillar                     text,
  strategy                   text,
  priority                   text,
  difficulty                 text,
  estimated_score_gain       numeric,
  estimated_financial_impact numeric,
  created_at                 timestamptz not null default now()
);

create table qr_codes (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references projects(id) on delete cascade,
  product_id  uuid references products(id) on delete cascade,
  public_url  text not null,
  qr_image_url text,
  created_at  timestamptz not null default now(),
  check (project_id is not null or product_id is not null)
);

create index on products (project_id);
create index on scores (project_id, computed_at desc);
create index on waste_metrics (project_id);
create index on recommendations (project_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table projects              enable row level security;
alter table products              enable row level security;
alter table project_materials     enable row level security;
alter table waste_metrics         enable row level security;
alter table lifecycle_metrics     enable row level security;
alter table financial_metrics     enable row level security;
alter table environmental_metrics enable row level security;
alter table scores                enable row level security;
alter table recommendations       enable row level security;
alter table qr_codes              enable row level security;
alter table profiles              enable row level security;

create or replace function current_role_is(roles user_role[])
returns boolean language sql stable as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.role = any(roles));
$$;

-- Anyone, signed in or not, may read the data the public QR page renders.
create policy "public read projects" on projects for select using (true);
create policy "public read products" on products for select using (true);
create policy "public read materials" on project_materials for select using (true);
create policy "public read waste" on waste_metrics for select using (true);
create policy "public read lifecycle" on lifecycle_metrics for select using (true);
create policy "public read environmental" on environmental_metrics for select using (true);
create policy "public read scores" on scores for select using (true);
create policy "public read qr" on qr_codes for select using (true);

-- Financials are private unless a project explicitly publishes them.
create policy "financials are private by default" on financial_metrics for select
  using (is_public or auth.uid() is not null);

create policy "signed in read recommendations" on recommendations for select
  using (auth.uid() is not null);

-- Writers: admins anywhere, managers and researchers on their own projects.
create policy "admins write projects" on projects for all
  using (current_role_is(array['admin']::user_role[]))
  with check (current_role_is(array['admin']::user_role[]));

create policy "owners write projects" on projects for all
  using (created_by = auth.uid() and current_role_is(array['project_manager','researcher']::user_role[]))
  with check (created_by = auth.uid());

create policy "profiles read self" on profiles for select using (id = auth.uid() or current_role_is(array['admin']::user_role[]));
create policy "profiles update self" on profiles for update using (id = auth.uid());
