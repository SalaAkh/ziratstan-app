-- UGC profile publishing flow:
-- 1) Track submission owner (for dashboard ownership after approval)
-- 2) Track published profile id (to avoid duplicate profile creation on re-approve)

alter table public.ugc_profile_submissions
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

alter table public.ugc_profile_submissions
  add column if not exists published_profile_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_ugc_profile_submissions_owner_id
  on public.ugc_profile_submissions(owner_id);

create index if not exists idx_ugc_profile_submissions_published_profile_id
  on public.ugc_profile_submissions(published_profile_id);

-- Allow users to read their own pending profile submissions.
drop policy if exists "user_read_own_ugc_profile_submissions" on public.ugc_profile_submissions;
create policy "user_read_own_ugc_profile_submissions"
on public.ugc_profile_submissions
for select
to authenticated
using (auth.uid() = owner_id or public.is_admin());

-- Keep public/auth submission path, but prevent authenticated users from spoofing owner_id.
drop policy if exists "public_submit_ugc_profile_submissions" on public.ugc_profile_submissions;
create policy "public_submit_ugc_profile_submissions"
on public.ugc_profile_submissions
for insert
to anon, authenticated
with check (
  coalesce(status, 'pending') = 'pending'
  and (owner_id is null or auth.uid() = owner_id)
);
