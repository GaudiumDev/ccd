-- Tabla de perfiles de usuario
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  phone text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Tabla de confraternidades
create table if not exists public.confraternities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  location text,
  created_at timestamp with time zone default now()
);

alter table public.confraternities enable row level security;

create policy "confraternities_select_all" on public.confraternities for select using (true);
create policy "confraternities_insert_auth" on public.confraternities for insert with check (auth.uid() is not null);
create policy "confraternities_update_auth" on public.confraternities for update using (auth.uid() is not null);

-- Tabla de retiros/convivencias
create table if not exists public.retreats (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('CcD', 'Retiro')),
  confraternity_id uuid references public.confraternities(id) on delete set null,
  location text,
  start_date date not null,
  end_date date not null,
  coordinator_id uuid references public.profiles(id) on delete set null,
  advisor_id uuid references public.profiles(id) on delete set null,
  status text not null default 'borrador' check (status in ('borrador', 'solicitado', 'aprobado', 'publicado', 'finalizado')),
  max_capacity integer default 30,
  current_capacity integer default 0,
  description text,
  price decimal(10,2) default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.retreats enable row level security;

create policy "retreats_select_published" on public.retreats for select using (status = 'publicado' or auth.uid() is not null);
create policy "retreats_insert_auth" on public.retreats for insert with check (auth.uid() is not null);
create policy "retreats_update_auth" on public.retreats for update using (auth.uid() is not null);

-- Tabla de inscripciones
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  retreat_id uuid not null references public.retreats(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pendiente' check (status in ('pendiente', 'confirmado', 'cancelado')),
  payment_status text not null default 'pendiente' check (payment_status in ('pendiente', 'pagado', 'reembolsado')),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(retreat_id, user_id)
);

alter table public.registrations enable row level security;

create policy "registrations_select_own" on public.registrations for select using (auth.uid() = user_id);
create policy "registrations_insert_own" on public.registrations for insert with check (auth.uid() = user_id);
create policy "registrations_update_own" on public.registrations for update using (auth.uid() = user_id);

-- Tabla de roles de usuario
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'eqt', 'delegado', 'coordinador', 'asesor', 'centralizador', 'convivente')),
  retreat_id uuid references public.retreats(id) on delete cascade,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone
);

alter table public.user_roles enable row level security;

create policy "user_roles_select_own" on public.user_roles for select using (auth.uid() = user_id);
create policy "user_roles_insert_admin" on public.user_roles for insert with check (auth.uid() is not null);

-- Tabla de noticias
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  author_id uuid references public.profiles(id) on delete set null,
  is_published boolean default false,
  published_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table public.news enable row level security;

create policy "news_select_published" on public.news for select using (is_published = true or auth.uid() is not null);
create policy "news_insert_auth" on public.news for insert with check (auth.uid() is not null);
create policy "news_update_auth" on public.news for update using (auth.uid() is not null);

-- Trigger para crear perfil automáticamente
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', null),
    coalesce(new.raw_user_meta_data ->> 'last_name', null)
  )
  on conflict (id) do nothing;

  -- Asignar rol de convivente por defecto
  insert into public.user_roles (user_id, role)
  values (new.id, 'convivente')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
