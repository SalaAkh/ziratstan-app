-- Восстановление оставшихся таблиц
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ugc_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cemetery_id VARCHAR(255),
  current_name VARCHAR(255),
  suggested_name VARCHAR(255) NOT NULL,
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),
  comment TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_type VARCHAR(50) NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  profile_ref VARCHAR(255),
  comment TEXT,
  price DECIMAL(10, 2),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ugc_profile_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cemetery_id VARCHAR(255),
  cemetery_name VARCHAR(255),
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),
  full_name VARCHAR(255) NOT NULL,
  birth_year VARCHAR(50),
  death_year VARCHAR(50),
  description TEXT,
  shezhire_entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  published_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ugc_bio_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(255),
  bio_text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin security hardening for Ziratstan
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and coalesce(u.raw_app_meta_data ->> 'role', '') = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.ugc_submissions enable row level security;
alter table public.ugc_profile_submissions enable row level security;
alter table public.ugc_bio_submissions enable row level security;
alter table public.services_leads enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "public_submit_ugc_submissions" on public.ugc_submissions;
create policy "public_submit_ugc_submissions"
on public.ugc_submissions
for insert
to anon, authenticated
with check (coalesce(status, 'pending') = 'pending');

drop policy if exists "admin_read_ugc_submissions" on public.ugc_submissions;
create policy "admin_read_ugc_submissions"
on public.ugc_submissions
for select
to authenticated
using (public.is_admin());

drop policy if exists "admin_update_ugc_submissions" on public.ugc_submissions;
create policy "admin_update_ugc_submissions"
on public.ugc_submissions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public_submit_ugc_profile_submissions" on public.ugc_profile_submissions;
create policy "public_submit_ugc_profile_submissions"
on public.ugc_profile_submissions
for insert
to anon, authenticated
with check (
  coalesce(status, 'pending') = 'pending'
  and (owner_id is null or auth.uid() = owner_id)
);

drop policy if exists "user_read_own_ugc_profile_submissions" on public.ugc_profile_submissions;
create policy "user_read_own_ugc_profile_submissions"
on public.ugc_profile_submissions
for select
to authenticated
using (auth.uid() = owner_id or public.is_admin());

drop policy if exists "admin_read_ugc_profile_submissions" on public.ugc_profile_submissions;
create policy "admin_read_ugc_profile_submissions"
on public.ugc_profile_submissions
for select
to authenticated
using (public.is_admin());

drop policy if exists "admin_update_ugc_profile_submissions" on public.ugc_profile_submissions;
create policy "admin_update_ugc_profile_submissions"
on public.ugc_profile_submissions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public_submit_ugc_bio_submissions" on public.ugc_bio_submissions;
create policy "public_submit_ugc_bio_submissions"
on public.ugc_bio_submissions
for insert
to anon, authenticated
with check (coalesce(status, 'pending') = 'pending');

drop policy if exists "admin_read_ugc_bio_submissions" on public.ugc_bio_submissions;
create policy "admin_read_ugc_bio_submissions"
on public.ugc_bio_submissions
for select
to authenticated
using (public.is_admin());

drop policy if exists "admin_update_ugc_bio_submissions" on public.ugc_bio_submissions;
create policy "admin_update_ugc_bio_submissions"
on public.ugc_bio_submissions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public_submit_services_leads" on public.services_leads;
create policy "public_submit_services_leads"
on public.services_leads
for insert
to anon, authenticated
with check (true);

drop policy if exists "admin_read_services_leads" on public.services_leads;
create policy "admin_read_services_leads"
on public.services_leads
for select
to authenticated
using (public.is_admin());

drop policy if exists "admin_update_services_leads" on public.services_leads;
create policy "admin_update_services_leads"
on public.services_leads
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public_read_public_profiles" on public.profiles;
create policy "public_read_public_profiles"
on public.profiles
for select
to anon, authenticated
using (visibility_status = 'public' or public.is_admin());

drop policy if exists "admin_manage_profiles" on public.profiles;
create policy "admin_manage_profiles"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create table if not exists public.admin_sessions (
  id bigserial primary key,
  track_id text not null unique,
  user_id uuid not null,
  email text null,
  device_id text not null,
  device_name text null,
  user_agent text null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz null,
  end_reason text null,
  created_at timestamptz not null default now()
);

alter table public.admin_sessions enable row level security;

drop policy if exists "admin_own_admin_sessions" on public.admin_sessions;
create policy "admin_own_admin_sessions"
on public.admin_sessions
for all
to authenticated
using (public.is_admin() and user_id = auth.uid())
with check (public.is_admin() and user_id = auth.uid());
