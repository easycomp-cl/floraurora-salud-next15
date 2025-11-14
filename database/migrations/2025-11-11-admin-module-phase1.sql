-- =============================================
-- Módulo 7 - Panel Administración
-- Fase 1: Gestión de usuarios y servicios
-- Fecha: 2025-11-11
-- =============================================

-- 1. Extensiones necesarias
create extension if not exists "uuid-ossp";

-- 2. Ajustes en tabla users
alter table public.users
  add column if not exists status text check (status in ('active', 'inactive', 'blocked', 'pending')) default 'active';

alter table public.users
  add column if not exists blocked_until timestamptz;

alter table public.users
  add column if not exists blocked_reason text;

create index if not exists idx_users_status on public.users (status);
create index if not exists idx_users_role on public.users (role);
create index if not exists idx_users_blocked_until on public.users (blocked_until);

-- 3. Tabla de servicios
create table if not exists public.services (
  id bigserial primary key,
  slug text unique not null,
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  currency text not null default 'CLP',
  duration_minutes integer not null default 50,
  is_active boolean not null default true,
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_services_is_active on public.services (is_active);
create index if not exists idx_services_validity on public.services (coalesce(valid_from, '1900-01-01'::date), coalesce(valid_to, '2999-12-31'::date));

-- 4. Tabla pivot de servicios asignados a profesionales
create table if not exists public.service_professionals (
  service_id bigint not null references public.services (id) on delete cascade,
  professional_id bigint not null references public.professionals (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (service_id, professional_id)
);

create index if not exists idx_service_professionals_professional on public.service_professionals (professional_id);

-- 5. Vistas de apoyo
create or replace view public.active_services as
select s.*
from public.services s
where s.is_active = true
  and (s.valid_from is null or s.valid_from <= current_date)
  and (s.valid_to is null or s.valid_to >= current_date);

-- 6. Trigger para updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_services_updated_at on public.services;
create trigger trg_services_updated_at
before update on public.services
for each row
execute function public.set_updated_at();

-- 7. Roles y permisos mínimos
grant select, insert, update on public.services to authenticated;
grant select on public.active_services to authenticated;
grant select, insert, update, delete on public.service_professionals to authenticated;


