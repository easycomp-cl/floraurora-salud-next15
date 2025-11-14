-- =============================================
-- Script para crear la tabla services y corregir relaciones
-- Ejecutar este script en Supabase SQL Editor
-- =============================================

-- 1. Crear la tabla de servicios si no existe
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

-- 2. Crear índices para la tabla services
create index if not exists idx_services_is_active on public.services (is_active);
create index if not exists idx_services_validity on public.services (coalesce(valid_from, '1900-01-01'::date), coalesce(valid_to, '2999-12-31'::date));

-- 3. Crear la tabla pivot de servicios asignados a profesionales si no existe
create table if not exists public.service_professionals (
  service_id bigint not null references public.services (id) on delete cascade,
  professional_id bigint not null references public.professionals (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (service_id, professional_id)
);

create index if not exists idx_service_professionals_professional on public.service_professionals (professional_id);
create index if not exists idx_service_professionals_service on public.service_professionals (service_id);

-- 4. Crear vista de servicios activos
create or replace view public.active_services as
select s.*
from public.services s
where s.is_active = true
  and (s.valid_from is null or s.valid_from <= current_date)
  and (s.valid_to is null or s.valid_to >= current_date);

-- 5. Crear función para updated_at si no existe
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 6. Crear trigger para updated_at en services
drop trigger if exists trg_services_updated_at on public.services;
create trigger trg_services_updated_at
before update on public.services
for each row
execute function public.set_updated_at();

-- 7. Verificar y crear la relación entre professionals y users si no existe
-- La relación debe ser: professionals.id -> users.id
-- Primero verificamos si existe la foreign key
do $$
begin
  -- Verificar si existe alguna foreign key desde professionals.id hacia users
  if not exists (
    select 1 
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu 
      on tc.constraint_name = kcu.constraint_name
    where tc.table_name = 'professionals'
      and kcu.column_name = 'id'
      and tc.constraint_type = 'FOREIGN KEY'
  ) then
    -- Crear la foreign key si professionals.id referencia a users.id
    alter table public.professionals
    add constraint professionals_id_fkey 
    foreign key (id) references public.users(id) on delete cascade;
    
    raise notice 'Foreign key creada: professionals.id -> users.id';
  else
    raise notice 'Foreign key ya existe entre professionals y users';
  end if;
exception
  when others then
    raise notice 'Error al crear foreign key: %', sqlerrm;
end $$;

-- 8. Otorgar permisos necesarios
grant select, insert, update, delete on public.services to authenticated;
grant select on public.active_services to authenticated;
grant select, insert, update, delete on public.service_professionals to authenticated;

-- 9. Habilitar RLS (Row Level Security) si es necesario
alter table public.services enable row level security;
alter table public.service_professionals enable row level security;

-- 10. Crear políticas RLS básicas (ajustar según tus necesidades)
-- Política para services: todos los usuarios autenticados pueden leer servicios activos
drop policy if exists "Servicios activos son visibles para usuarios autenticados" on public.services;
create policy "Servicios activos son visibles para usuarios autenticados"
on public.services
for select
to authenticated
using (is_active = true);

-- Política para service_professionals: usuarios autenticados pueden leer
drop policy if exists "Usuarios autenticados pueden leer asignaciones de servicios" on public.service_professionals;
create policy "Usuarios autenticados pueden leer asignaciones de servicios"
on public.service_professionals
for select
to authenticated
using (true);

