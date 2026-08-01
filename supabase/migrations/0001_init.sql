-- ============================================================
-- PROJETO FALSO MAGRO 30D — MIGRATION INICIAL SUPABASE
-- ============================================================
-- Copie este arquivo inteiro e rode no SQL Editor do seu projeto
-- Supabase (Dashboard → SQL Editor → New query → Run).
--
-- Esta migration cria:
--   1. Tabela de códigos de acesso (access_codes)
--   2. Tabela de tentativas de acesso (rate limit básico)
--   3. Tabela de perfis (profiles)
--   4. Tabela de metas (goals)
--   5. Tabela de check-ins (checkins)
--   6. Índices e constraints
--   7. Row Level Security (RLS) + policies
--   8. Triggers de updated_at
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. ACCESS_CODES
-- Nunca é acessada diretamente pelo frontend (nem com a chave
-- anon/publishable). Só é lida/escrita pelas Edge Functions,
-- que usam a service_role internamente (bypassa RLS).
-- ------------------------------------------------------------
create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text unique not null,
  code_display_prefix text not null,   -- ex: "FM30"
  code_display_suffix text not null,   -- ex: "X9Q2" (últimos 4 caracteres, para exibição mascarada)
  status text not null default 'active' check (status in ('active', 'used', 'blocked', 'expired')),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  last_used_at timestamptz,
  expires_at timestamptz,
  notes text
);

create index if not exists idx_access_codes_status on public.access_codes(status);
create index if not exists idx_access_codes_user_id on public.access_codes(user_id);

alter table public.access_codes enable row level security;
-- Nenhuma policy é criada de propósito: nem anon nem authenticated
-- conseguem ler/escrever esta tabela. Somente service_role (Edge
-- Functions) tem acesso, pois service_role sempre ignora RLS.

-- ------------------------------------------------------------
-- 2. ACCESS_ATTEMPTS (rate limit básico por IP)
-- ------------------------------------------------------------
create table if not exists public.access_attempts (
  id bigint generated always as identity primary key,
  ip text not null,
  kind text not null default 'redeem' check (kind in ('redeem', 'admin')),
  attempted_at timestamptz not null default now()
);

create index if not exists idx_access_attempts_ip_kind_time
  on public.access_attempts(ip, kind, attempted_at);

alter table public.access_attempts enable row level security;
-- Sem policies: acesso exclusivo via service_role (Edge Functions).

-- ------------------------------------------------------------
-- 3. PROFILES
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  access_code_id uuid references public.access_codes(id) on delete set null,
  name text,
  start_date date,
  completion_shown boolean not null default false,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ------------------------------------------------------------
-- 4. GOALS
-- ------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  tmb numeric,
  get numeric,
  calories numeric,
  protein numeric,
  carbs numeric,
  fat numeric,
  water numeric,
  input_data jsonb,
  calculated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "goals_select_own"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "goals_insert_own"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "goals_update_own"
  on public.goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "goals_delete_own"
  on public.goals for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 5. CHECKINS
-- ------------------------------------------------------------
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key date not null,
  day_number integer not null,
  weight numeric not null,
  water_ml numeric,
  trained boolean,
  slept_well boolean,
  energy integer check (energy between 1 and 10),
  nutrition text check (nutrition in ('excelente', 'boa', 'regular', 'ruim')),
  notes text,
  saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_checkins_user_date unique (user_id, date_key)
);

create index if not exists idx_checkins_user_date on public.checkins(user_id, date_key desc);

alter table public.checkins enable row level security;

create policy "checkins_select_own"
  on public.checkins for select
  using (auth.uid() = user_id);

create policy "checkins_insert_own"
  on public.checkins for insert
  with check (auth.uid() = user_id);

create policy "checkins_update_own"
  on public.checkins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "checkins_delete_own"
  on public.checkins for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 6. TRIGGERS — updated_at automático
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_goals_updated_at on public.goals;
create trigger trg_goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

drop trigger if exists trg_checkins_updated_at on public.checkins;
create trigger trg_checkins_updated_at
  before update on public.checkins
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 7. LIMPEZA PERIÓDICA (opcional) — tentativas de acesso antigas
-- Pode ser chamada manualmente ou via pg_cron, se disponível no plano.
-- ------------------------------------------------------------
create or replace function public.cleanup_old_access_attempts()
returns void
language sql
as $$
  delete from public.access_attempts
  where attempted_at < now() - interval '24 hours';
$$;

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
