-- supabase/migrations/20260314_fix_dashboard_warnings_v2_down.sql
-- V2 Rollback to original permissive and unoptimized RLS

-- 1. Restore Functions
ALTER FUNCTION public.handle_new_user() RESET search_path;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
    AND COALESCE(u.raw_app_meta_data ->> 'role', '') = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_profile_owner(p_profile_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = p_profile_id AND p.owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.profile_collaborators c WHERE c.profile_id = p_profile_id AND c.user_id = p_user_id AND c.role IN ('admin', 'editor')
  ) OR public.is_admin();
END;
$$;


-- 2. Drop all new strict combined policies and recreate the old sloppy ones

-- Drop V2 policies on profiles
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_allowed" ON public.profiles;
DROP POLICY IF EXISTS "memorial_owner_insert" ON public.profiles;
DROP POLICY IF EXISTS "memorial_owner_delete" ON public.profiles;

-- Recreate V1 profiles
CREATE POLICY "memorial_public_read" ON public.profiles FOR SELECT USING (status = 'published');
CREATE POLICY "memorial_owner_read" ON public.profiles FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "memorial_owner_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "memorial_owner_update" ON public.profiles FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "memorial_owner_delete" ON public.profiles FOR DELETE USING (auth.uid() = owner_id);

-- Drop V2 policies on user_profiles
DROP POLICY IF EXISTS "user_profiles_self_read" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_self_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_self_update" ON public.user_profiles;

CREATE POLICY "user_profiles_self_read" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_profiles_self_insert" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_profiles_self_update" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Profile collaborators
DROP POLICY IF EXISTS "collab_read_all" ON public.profile_collaborators;
DROP POLICY IF EXISTS "collab_owner_insert" ON public.profile_collaborators;
DROP POLICY IF EXISTS "collab_owner_update" ON public.profile_collaborators;
DROP POLICY IF EXISTS "collab_owner_delete" ON public.profile_collaborators;

CREATE POLICY "collab_owner_read" ON public.profile_collaborators FOR SELECT USING (public.is_profile_owner(profile_id, auth.uid()));
CREATE POLICY "collab_self_read" ON public.profile_collaborators FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "collab_owner_insert" ON public.profile_collaborators FOR INSERT WITH CHECK (public.is_profile_owner(profile_id, auth.uid()));
CREATE POLICY "collab_owner_update" ON public.profile_collaborators FOR UPDATE USING (public.is_profile_owner(profile_id, auth.uid()));
CREATE POLICY "collab_owner_delete" ON public.profile_collaborators FOR DELETE USING (public.is_profile_owner(profile_id, auth.uid()));


-- Drop dynamically created other tables
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('qr_codes', 'services_orders', 'media_attachments', 'ugc_submissions', 'ugc_bio_submissions', 'cemeteries')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- recreate sloppy ones using auth.uid directly
CREATE POLICY "qr_codes_read" ON public.qr_codes FOR SELECT USING (true);
CREATE POLICY "qr_codes_insert" ON public.qr_codes FOR INSERT WITH CHECK (true);

CREATE POLICY "services_orders_read" ON public.services_orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "services_orders_insert" ON public.services_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "services_orders_update" ON public.services_orders FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "media_read" ON public.media_attachments FOR SELECT USING (true);
CREATE POLICY "media_insert" ON public.media_attachments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "media_update" ON public.media_attachments FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "cemeteries_read" ON public.cemeteries FOR SELECT USING (true);
CREATE POLICY "cemeteries_insert" ON public.cemeteries FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "ugc_submissions_read" ON public.ugc_submissions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "ugc_submissions_insert" ON public.ugc_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ugc_bio_submissions_read" ON public.ugc_bio_submissions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "ugc_bio_submissions_insert" ON public.ugc_bio_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Drop indexes
DROP INDEX IF EXISTS public.idx_profiles_cemetery_id;
DROP INDEX IF EXISTS public.idx_qr_codes_cemetery_id;
DROP INDEX IF EXISTS public.idx_media_attachments_profile_id;
