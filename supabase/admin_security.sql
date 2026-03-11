-- Admin security hardening for Ziratstan
-- This file closes admin data behind Supabase RLS policies.

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
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
with check (coalesce(status, 'pending') = 'pending');

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
