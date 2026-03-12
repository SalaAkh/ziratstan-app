-- Make admin check resilient to stale JWT app_metadata claims.
-- RLS should rely on canonical role in auth.users.

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
