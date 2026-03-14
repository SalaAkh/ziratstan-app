-- Enforce admin moderation priority over owner visibility toggles.
-- If a profile came from UGC moderation and current status is not "approved",
-- non-admin users cannot change profiles.visibility_status.

create or replace function public.enforce_admin_moderation_visibility_lock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  moderation_status text;
begin
  -- Allow trusted backend roles to bypass this guard.
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.visibility_status is distinct from old.visibility_status then
    if public.is_admin() then
      return new;
    end if;

    select u.status
      into moderation_status
    from public.ugc_profile_submissions u
    where u.published_profile_id = new.id
    order by u.submitted_at desc, u.id desc
    limit 1;

    if moderation_status is not null and moderation_status <> 'approved' then
      raise exception 'Visibility is locked by admin moderation status: %', moderation_status
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_visibility_admin_lock on public.profiles;
create trigger trg_profiles_visibility_admin_lock
before update of visibility_status on public.profiles
for each row
execute function public.enforce_admin_moderation_visibility_lock();
