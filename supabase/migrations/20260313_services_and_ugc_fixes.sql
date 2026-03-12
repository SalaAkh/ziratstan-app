-- Runtime stability fixes for service orders, UGC rename flow and profile visibility

alter table public.services_orders
  alter column profile_id set not null;

alter table public.services_orders
  alter column customer_email set not null;

alter table public.ugc_submissions
  add column if not exists cemetery_id varchar(255);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_visibility_status_check'
  ) then
    alter table public.profiles
      drop constraint profiles_visibility_status_check;
  end if;
end;
$$;

alter table public.profiles
  add constraint profiles_visibility_status_check
  check (visibility_status in ('public', 'family_only', 'private'));
