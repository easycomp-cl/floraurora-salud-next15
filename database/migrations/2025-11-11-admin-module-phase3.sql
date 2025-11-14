-- =============================================
-- Módulo 7 - Panel Administración
-- Fase 3: Configuración general y auditoría
-- Fecha: 2025-11-11
-- =============================================

-- 1. Tabla de plantillas de notificación
create table if not exists public.notification_templates (
  id bigserial primary key,
  channel text not null check (channel in ('email', 'whatsapp')),
  template_key text not null unique,
  name text not null,
  subject text,
  body text not null,
  variables jsonb default '[]'::jsonb,
  is_active boolean not null default true,
  updated_by integer references public.users (id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_notification_templates_channel on public.notification_templates(channel);

-- 2. Tabla de configuraciones del sistema
create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_by integer references public.users (id),
  updated_at timestamptz not null default now()
);

insert into public.system_settings (key, value)
values
  ('scheduling', '{"timezone": "America/Santiago", "active_days": [1,2,3,4,5], "business_hours": {"start": "08:00", "end": "20:00"}}'),
  ('rules', '{"min_cancelation_hours": 12, "reschedule_limit_hours": 6}')
on conflict (key) do nothing;

-- 3. Tabla de elementos del carrusel de home
create table if not exists public.home_carousel_items (
  id bigserial primary key,
  title text,
  message text,
  image_url text,
  cta_label text,
  cta_link text,
  start_date date,
  end_date date,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by integer references public.users (id)
);

create index if not exists idx_home_carousel_active on public.home_carousel_items(is_active);
create index if not exists idx_home_carousel_order on public.home_carousel_items(display_order);

-- 4. Tabla de logs administrativos
create table if not exists public.admin_logs (
  id bigserial primary key,
  actor_id integer references public.users (id),
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  ip_address text
);

create index if not exists idx_admin_logs_actor on public.admin_logs(actor_id);
create index if not exists idx_admin_logs_entity on public.admin_logs(entity);
create index if not exists idx_admin_logs_created_at on public.admin_logs(created_at desc);

-- 5. Trigger para updated_at en tablas nuevas
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_home_carousel_updated_at on public.home_carousel_items;
create trigger trg_home_carousel_updated_at
before update on public.home_carousel_items
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_notification_templates_updated_at on public.notification_templates;
create trigger trg_notification_templates_updated_at
before update on public.notification_templates
for each row
execute function public.touch_updated_at();

-- 6. Permisos
grant select, insert, update, delete on public.notification_templates to authenticated;
grant select, insert, update, delete on public.home_carousel_items to authenticated;
grant select, insert on public.admin_logs to authenticated;
grant select, update on public.system_settings to authenticated;

