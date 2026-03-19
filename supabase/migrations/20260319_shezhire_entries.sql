-- Replace the mistaken profile category field with repeatable shezhire entries.

alter table public.profiles
  drop constraint if exists profiles_profile_category_check;

alter table public.ugc_profile_submissions
  drop constraint if exists ugc_profile_submissions_profile_category_check;

alter table public.profiles
  drop column if exists profile_category;

alter table public.ugc_profile_submissions
  drop column if exists profile_category;

alter table public.profiles
  add column if not exists shezhire_entries jsonb not null default '[]'::jsonb;

alter table public.ugc_profile_submissions
  add column if not exists shezhire_entries jsonb not null default '[]'::jsonb;

update public.profiles
set shezhire_entries = '[]'::jsonb
where shezhire_entries is null;

update public.ugc_profile_submissions
set shezhire_entries = '[]'::jsonb
where shezhire_entries is null;
