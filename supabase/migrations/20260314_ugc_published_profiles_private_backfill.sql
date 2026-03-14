-- Backfill: keep UGC-approved profiles private by default.
-- This updates already published rows created before the visibility fix.

update public.profiles p
set visibility_status = 'private'
from public.ugc_profile_submissions u
where u.published_profile_id = p.id
  and p.visibility_status <> 'private';

update public.profiles p
set owner_id = u.owner_id
from public.ugc_profile_submissions u
where u.published_profile_id = p.id
  and p.owner_id is null
  and u.owner_id is not null;
