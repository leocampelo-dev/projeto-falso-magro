-- 0002_kiwify_access.sql
-- Aditivo. Não altera nem remove nada que já existe.
--
-- Objetivo:
--  1) Guardar e-mail real do comprador + status/validade do acesso no profile.
--  2) Registrar cada evento recebido da Kiwify (auditoria + idempotência,
--     já que a Kiwify pode reenviar o mesmo webhook mais de uma vez).

alter table public.profiles
  add column if not exists email text,
  add column if not exists access_status text not null default 'active',
  add column if not exists access_expires_at timestamptz,
  add column if not exists access_source text,
  add column if not exists kiwify_customer_id text;

comment on column public.profiles.access_status is 'active | blocked (bloqueado por reembolso/chargeback, dados preservados)';
comment on column public.profiles.access_expires_at is 'data limite de acesso (compra Kiwify = 60 dias). null = sem controle de validade (ex.: admin).';
comment on column public.profiles.access_source is 'origem do acesso: kiwify | access_code | admin';

create table if not exists public.kiwify_events (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  event text not null,
  order_status text,
  email text,
  user_id uuid references auth.users(id),
  payload jsonb,
  processed_at timestamptz not null default now(),
  unique (order_id, event)
);

comment on table public.kiwify_events is 'Log de todo webhook da Kiwify processado. unique(order_id,event) garante idempotência em reenvios.';

alter table public.kiwify_events enable row level security;
-- Nenhuma policy criada de propósito: só a service_role (Edge Function) acessa esta tabela.
