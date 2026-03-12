-- ============================================================
-- ZIRATSTAN.KZ — User/Memorial domain separation + RLS
-- ============================================================

create extension if not exists "uuid-ossp";

-- 1) User profiles (for auth.users), separate from memorial profiles
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Memorial profiles ownership/visibility (public.profiles is memorial domain)
alter table public.profiles
  add column if not exists owner_id uuid references auth.users(id) on delete set null,
  add column if not exists visibility_status varchar(20) default 'public';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_visibility_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_visibility_status_check
      check (visibility_status in ('public', 'family_only', 'private'));
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'visibility'
  ) then
    update public.profiles
    set visibility_status = coalesce(visibility_status, visibility::text)
    where visibility is not null;
  end if;
end;
$$;

create index if not exists idx_profiles_owner_id on public.profiles(owner_id);

-- 3) Collaborators for memorials
create table if not exists public.profile_collaborators (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role varchar(50) default 'editor' check (role in ('viewer', 'editor', 'admin')),
  created_at timestamptz not null default now(),
  unique(profile_id, user_id)
);

create index if not exists idx_profile_collab_profile_id on public.profile_collaborators(profile_id);
create index if not exists idx_profile_collab_user_id on public.profile_collaborators(user_id);

-- 4) RLS enablement
alter table public.user_profiles enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_collaborators enable row level security;

create or replace function public.is_profile_owner(p_profile_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id and p.owner_id = p_user_id
  );
$$;

-- user_profiles policies
drop policy if exists "user_profiles_self_read" on public.user_profiles;
create policy "user_profiles_self_read"
  on public.user_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "user_profiles_self_insert" on public.user_profiles;
create policy "user_profiles_self_insert"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_profiles_self_update" on public.user_profiles;
create policy "user_profiles_self_update"
  on public.user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- memorial profiles policies
drop policy if exists "memorial_public_read" on public.profiles;
create policy "memorial_public_read"
  on public.profiles for select
  using (visibility_status = 'public');

drop policy if exists "memorial_owner_read" on public.profiles;
create policy "memorial_owner_read"
  on public.profiles for select
  using (auth.uid() = owner_id);

drop policy if exists "memorial_collaborator_read" on public.profiles;
create policy "memorial_collaborator_read"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.profile_collaborators c
      where c.profile_id = public.profiles.id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "memorial_owner_insert" on public.profiles;
create policy "memorial_owner_insert"
  on public.profiles for insert
  with check (auth.uid() is not null and auth.uid() = owner_id);

drop policy if exists "memorial_owner_update" on public.profiles;
create policy "memorial_owner_update"
  on public.profiles for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "memorial_collaborator_update" on public.profiles;
create policy "memorial_collaborator_update"
  on public.profiles for update
  using (
    exists (
      select 1
      from public.profile_collaborators c
      where c.profile_id = public.profiles.id
        and c.user_id = auth.uid()
        and c.role in ('editor', 'admin')
    )
  );

drop policy if exists "memorial_owner_delete" on public.profiles;
create policy "memorial_owner_delete"
  on public.profiles for delete
  using (auth.uid() = owner_id);

-- collaborators policies
drop policy if exists "collab_owner_read" on public.profile_collaborators;
create policy "collab_owner_read"
  on public.profile_collaborators for select
  using (public.is_profile_owner(profile_id, auth.uid()));

drop policy if exists "collab_self_read" on public.profile_collaborators;
create policy "collab_self_read"
  on public.profile_collaborators for select
  using (user_id = auth.uid());

drop policy if exists "collab_owner_insert" on public.profile_collaborators;
create policy "collab_owner_insert"
  on public.profile_collaborators for insert
  with check (public.is_profile_owner(profile_id, auth.uid()));

drop policy if exists "collab_owner_update" on public.profile_collaborators;
create policy "collab_owner_update"
  on public.profile_collaborators for update
  using (public.is_profile_owner(profile_id, auth.uid()))
  with check (public.is_profile_owner(profile_id, auth.uid()));

drop policy if exists "collab_owner_delete" on public.profile_collaborators;
create policy "collab_owner_delete"
  on public.profile_collaborators for delete
  using (public.is_profile_owner(profile_id, auth.uid()));

create or replace view public.my_profiles as
  select p.*
  from public.profiles p
  where p.owner_id = auth.uid()
  order by p.created_at desc;
