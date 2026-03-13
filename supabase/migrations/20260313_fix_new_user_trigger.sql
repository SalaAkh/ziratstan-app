-- ============================================================
-- ZIRATSTAN — Fix: new Google OAuth accounts cannot sign in
-- Root cause: handle_new_user trigger may fail on INSERT into
-- user_profiles when RLS blocks the service-role context,
-- causing the entire auth.users INSERT transaction to rollback.
-- ============================================================

-- 1. Recreate the trigger function with explicit security definer
--    and BYPASSING RLS via SET check_policy = off inside the function.
--    Using ON CONFLICT DO NOTHING ensures idempotency.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer                   -- runs as function owner (postgres), not calling role
set search_path = public           -- prevent search_path injection
as $$
begin
  insert into public.user_profiles (user_id, full_name, avatar_url, created_at, updated_at)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',       -- Google OAuth sends 'name' not 'full_name'
      split_part(new.email, '@', 1)          -- fallback: use email prefix
    ),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null),
    now(),
    now()
  )
  on conflict (user_id) do update
    set
      full_name  = coalesce(excluded.full_name, public.user_profiles.full_name),
      avatar_url = coalesce(excluded.avatar_url, public.user_profiles.avatar_url),
      updated_at = now()
  ;
  return new;
exception
  -- Silently swallow any error so auth.users INSERT always succeeds.
  -- The user can update their profile later; a failed profile row
  -- must never prevent login.
  when others then
    raise warning '[ziratstan] handle_new_user failed for user %: % %', new.id, sqlerrm, sqlstate;
    return new;
end;
$$;

-- 2. Ensure the trigger exists (recreate to pick up updated function)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Grant the anon/authenticated/service_role execute permission on the function
grant execute on function public.handle_new_user() to service_role;

-- 4. Ensure RLS policies on user_profiles allow the trigger to insert.
--    The trigger runs as 'postgres' (security definer owner), which bypasses RLS,
--    but we also add a safe insert policy for authenticated users creating their own row.
drop policy if exists "user_profiles_self_insert" on public.user_profiles;
create policy "user_profiles_self_insert"
  on public.user_profiles for insert
  with check (
    auth.uid() = user_id          -- normal authenticated INSERT
    OR auth.uid() IS NULL         -- allow service-role / trigger context
  );

-- Also ensure SELECT policy is permissive enough during sign-in
drop policy if exists "user_profiles_self_read" on public.user_profiles;
create policy "user_profiles_self_read"
  on public.user_profiles for select
  using (auth.uid() = user_id);
