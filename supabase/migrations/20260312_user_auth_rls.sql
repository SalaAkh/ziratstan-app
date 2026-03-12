-- ============================================================
-- ZIRATSTAN.KZ — User Authentication & Data Isolation Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─── 1. USER PROFILES TABLE ───────────────────────────────────
-- Extends Supabase auth.users with public profile info
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Add owner_id and visibility to the main profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'family_only', 'private'));

-- Create an index to quickly filter profiles by the owner
CREATE INDEX IF NOT EXISTS idx_profiles_owner_id ON public.profiles(owner_id);

-- 3. Create a table for managing shared access (family members)
CREATE TABLE IF NOT EXISTS public.profile_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'editor' CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_collab_profile_id ON public.profile_collaborators(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_collab_user_id ON public.profile_collaborators(user_id);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_collaborators ENABLE ROW LEVEL SECURITY;

----------------------------------------------------------------------------------
-- HELPER FUNCTION TO PREVENT INFINITE RECURSION
----------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_profile_owner(p_profile_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_profile_id AND owner_id = p_user_id
  );
$$;

----------------------------------------------------------------------------------
-- RLS POLICIES FOR 'profiles' TABLE
----------------------------------------------------------------------------------

-- 1. Anyone can VIEW public profiles
DROP POLICY IF EXISTS "Public profiles are visible to everyone" ON public.profiles;
CREATE POLICY "Public profiles are visible to everyone"
  ON public.profiles FOR SELECT
  USING (visibility = 'public');

-- 2. Owners can VIEW their own profiles (regardless of visibility)
DROP POLICY IF EXISTS "Owners can view their own profiles" ON public.profiles;
CREATE POLICY "Owners can view their own profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = owner_id);

-- 3. Collaborators can VIEW profiles they are attached to
DROP POLICY IF EXISTS "Collaborators can view shared profiles" ON public.profiles;
CREATE POLICY "Collaborators can view shared profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_collaborators
      WHERE profile_id = public.profiles.id AND user_id = auth.uid()
    )
  );

-- 4. Owners can INSERT new profiles (must set themselves as owner)
DROP POLICY IF EXISTS "Users can create profiles and set themselves as owners" ON public.profiles;
CREATE POLICY "Users can create profiles and set themselves as owners"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = owner_id);

-- 5. Owners can UPDATE their own profiles
DROP POLICY IF EXISTS "Owners can update their own profiles" ON public.profiles;
CREATE POLICY "Owners can update their own profiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = owner_id);

-- 6. Collaborators with 'editor' or 'admin' role can UPDATE
DROP POLICY IF EXISTS "Editor collaborators can update profiles" ON public.profiles;
CREATE POLICY "Editor collaborators can update profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_collaborators
      WHERE profile_id = public.profiles.id
      AND user_id = auth.uid()
      AND role IN ('editor', 'admin')
    )
  );

-- 7. Owners can DELETE their own profiles
DROP POLICY IF EXISTS "Owners can delete their own profiles" ON public.profiles;
CREATE POLICY "Owners can delete their own profiles"
  ON public.profiles FOR DELETE
  USING (auth.uid() = owner_id);

----------------------------------------------------------------------------------
-- RLS POLICIES FOR 'profile_collaborators' TABLE
----------------------------------------------------------------------------------

-- 1. Owners of the profile can VIEW its collaborators
DROP POLICY IF EXISTS "Profile owners can view collaborators" ON public.profile_collaborators;
CREATE POLICY "Profile owners can view collaborators"
  ON public.profile_collaborators FOR SELECT
  USING (public.is_profile_owner(profile_id, auth.uid()));

-- 2. Collaborators can VIEW themselves and others on the same profile
DROP POLICY IF EXISTS "Collaborators can view other collaborators on the same profile" ON public.profile_collaborators;
CREATE POLICY "Collaborators can view other collaborators on the same profile"
  ON public.profile_collaborators FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profile_collaborators pc
      WHERE pc.profile_id = profile_id AND pc.user_id = auth.uid()
    )
  );

-- 3. Owners of the profile can INSERT new collaborators
DROP POLICY IF EXISTS "Profile owners can insert collaborators" ON public.profile_collaborators;
CREATE POLICY "Profile owners can insert collaborators"
  ON public.profile_collaborators FOR INSERT
  WITH CHECK (public.is_profile_owner(profile_id, auth.uid()));

-- 4. Owners of the profile can UPDATE collaborators' roles
DROP POLICY IF EXISTS "Profile owners can update collaborators" ON public.profile_collaborators;
CREATE POLICY "Profile owners can update collaborators"
  ON public.profile_collaborators FOR UPDATE
  USING (public.is_profile_owner(profile_id, auth.uid()));

-- 5. Owners of the profile can DELETE collaborators
DROP POLICY IF EXISTS "Profile owners can delete collaborators" ON public.profile_collaborators;
CREATE POLICY "Profile owners can delete collaborators"
  ON public.profile_collaborators FOR DELETE
  USING (public.is_profile_owner(profile_id, auth.uid()));

-- ─── 8. HELPER: Get user's own profiles ──────────────
CREATE OR REPLACE VIEW public.my_profiles AS
  SELECT d.*
  FROM public.profiles d
  WHERE d.owner_id = auth.uid()
  ORDER BY d.created_at DESC;

-- ─── 9. MIGRATE EXISTING RECORDS (assign to admin if needed) ──
-- If you have existing records without owner_id, run this once to leave them as public/unclaimed:
-- UPDATE public.deceased SET visibility = 'public' WHERE owner_id IS NULL;

-- ─── DONE ─────────────────────────────────────────────────────
-- После запуска этого SQL:
-- 1. Профили усопших с visibility='public' видны всем (для SEO)
-- 2. Редактировать может только owner или collaborator
-- 3. Пользователь видит 'Мои профили' только в своём кабинете
