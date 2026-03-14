-- ==========================================
-- DOWN MIGRATION (ROLLBACK)
-- Rollback Fixes for Supabase Security warnings
-- ==========================================

-- 1. Rollback Function Search Path Mutable
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

-- 2. Rollback RLS Disabled for spatial_ref_sys
DROP POLICY IF EXISTS "spatial_ref_sys_public_read" ON public.spatial_ref_sys;
ALTER TABLE public.spatial_ref_sys DISABLE ROW LEVEL SECURITY;

-- 3. Rollback index
DROP INDEX IF EXISTS public.idx_profiles_cemetery_id;

-- 4. Rollback RLS Policy Always True for services_leads
DROP POLICY IF EXISTS "public_submit_services_leads" ON public.services_leads;
CREATE POLICY "public_submit_services_leads"
ON public.services_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 5. Rollback to direct auth.uid()
-- 5.1 user_profiles
DROP POLICY IF EXISTS "user_profiles_self_read" ON public.user_profiles;
CREATE POLICY "user_profiles_self_read"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_profiles_self_insert" ON public.user_profiles;
CREATE POLICY "user_profiles_self_insert"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_profiles_self_update" ON public.user_profiles;
CREATE POLICY "user_profiles_self_update"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5.2 profiles
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;

CREATE POLICY "memorial_public_read"
  ON public.profiles FOR SELECT
  USING (visibility_status = 'public');

CREATE POLICY "memorial_owner_read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "memorial_collaborator_read"
  ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profile_collaborators c WHERE c.profile_id = public.profiles.id AND c.user_id = auth.uid()));

CREATE POLICY "public_read_public_profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (visibility_status = 'public' OR public.is_admin());

DROP POLICY IF EXISTS "memorial_owner_insert" ON public.profiles;
CREATE POLICY "memorial_owner_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = owner_id);

DROP POLICY IF EXISTS "memorial_owner_update" ON public.profiles;
CREATE POLICY "memorial_owner_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "memorial_collaborator_update" ON public.profiles;
CREATE POLICY "memorial_collaborator_update"
  ON public.profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profile_collaborators c WHERE c.profile_id = public.profiles.id AND c.user_id = auth.uid() AND c.role IN ('editor', 'admin')));

DROP POLICY IF EXISTS "memorial_owner_delete" ON public.profiles;
CREATE POLICY "memorial_owner_delete"
  ON public.profiles FOR DELETE
  USING (auth.uid() = owner_id);

-- 5.3 profile_collaborators
DROP POLICY IF EXISTS "collab_read_all" ON public.profile_collaborators;

CREATE POLICY "collab_owner_read"
  ON public.profile_collaborators FOR SELECT
  USING (public.is_profile_owner(profile_id, auth.uid()));

CREATE POLICY "collab_self_read"
  ON public.profile_collaborators FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "collab_owner_insert" ON public.profile_collaborators;
CREATE POLICY "collab_owner_insert"
  ON public.profile_collaborators FOR INSERT
  WITH CHECK (public.is_profile_owner(profile_id, auth.uid()));

DROP POLICY IF EXISTS "collab_owner_update" ON public.profile_collaborators;
CREATE POLICY "collab_owner_update"
  ON public.profile_collaborators FOR UPDATE
  USING (public.is_profile_owner(profile_id, auth.uid()))
  WITH CHECK (public.is_profile_owner(profile_id, auth.uid()));

DROP POLICY IF EXISTS "collab_owner_delete" ON public.profile_collaborators;
CREATE POLICY "collab_owner_delete"
  ON public.profile_collaborators FOR DELETE
  USING (public.is_profile_owner(profile_id, auth.uid()));

-- 5.4 admin_sessions
DROP POLICY IF EXISTS "admin_own_admin_sessions" ON public.admin_sessions;
CREATE POLICY "admin_own_admin_sessions"
ON public.admin_sessions
FOR ALL
TO authenticated
USING (public.is_admin() AND user_id = auth.uid())
WITH CHECK (public.is_admin() AND user_id = auth.uid());

-- 5.5 ugc_profile_submissions
DROP POLICY IF EXISTS "ugc_profile_submissions_read_all" ON public.ugc_profile_submissions;

CREATE POLICY "user_read_own_ugc_profile_submissions"
ON public.ugc_profile_submissions
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "admin_read_ugc_profile_submissions"
ON public.ugc_profile_submissions
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "public_submit_ugc_profile_submissions" ON public.ugc_profile_submissions;
CREATE POLICY "public_submit_ugc_profile_submissions"
ON public.ugc_profile_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (COALESCE(status, 'pending') = 'pending' AND (owner_id IS NULL OR auth.uid() = owner_id));
