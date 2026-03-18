-- Profile categories for admin-created and map-submitted profiles.

alter table public.profiles
  add column if not exists profile_category varchar(60);

alter table public.ugc_profile_submissions
  add column if not exists profile_category varchar(60);

update public.profiles
set profile_category = lower(replace(trim(profile_category), ' ', '_'))
where profile_category is not null;

update public.ugc_profile_submissions
set profile_category = lower(replace(trim(profile_category), ' ', '_'))
where profile_category is not null;

update public.profiles
set profile_category = 'other'
where profile_category is not null
  and profile_category not in ('shezhire', 'historical', 'military', 'religious', 'educator', 'culture', 'public_figure', 'other');

update public.ugc_profile_submissions
set profile_category = 'other'
where profile_category is not null
  and profile_category not in ('shezhire', 'historical', 'military', 'religious', 'educator', 'culture', 'public_figure', 'other');

update public.profiles
set profile_category = 'shezhire'
where profile_category is null;

update public.ugc_profile_submissions
set profile_category = 'shezhire'
where profile_category is null;

alter table public.profiles
  alter column profile_category set default 'shezhire';

alter table public.ugc_profile_submissions
  alter column profile_category set default 'shezhire';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_profile_category_check'
  ) then
    alter table public.profiles
      add constraint profiles_profile_category_check
      check (profile_category in ('shezhire', 'historical', 'military', 'religious', 'educator', 'culture', 'public_figure', 'other'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ugc_profile_submissions_profile_category_check'
  ) then
    alter table public.ugc_profile_submissions
      add constraint ugc_profile_submissions_profile_category_check
      check (profile_category in ('shezhire', 'historical', 'military', 'religious', 'educator', 'culture', 'public_figure', 'other'));
  end if;
end;
$$;
