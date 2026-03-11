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

-- ─── 2. ADD OWNER_ID TO DECEASED TABLE ────────────────────────
-- This links each deceased profile to the user who created it
ALTER TABLE public.deceased
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'family_only', 'private'));

-- Create index for fast user-based queries
CREATE INDEX IF NOT EXISTS idx_deceased_owner ON public.deceased(owner_id);
CREATE INDEX IF NOT EXISTS idx_deceased_visibility ON public.deceased(visibility);

-- ─── 3. COLLABORATORS TABLE ───────────────────────────────────
-- Allows multiple family members to manage one deceased profile
CREATE TABLE IF NOT EXISTS public.deceased_collaborators (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deceased_id  TEXT NOT NULL REFERENCES public.deceased(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  invited_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(deceased_id, user_id)
);

-- ─── 4. ENABLE ROW LEVEL SECURITY ─────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deceased ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deceased_collaborators ENABLE ROW LEVEL SECURITY;

-- ─── 5. RLS POLICIES: PROFILES ────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─── 6. RLS POLICIES: DECEASED ────────────────────────────────
-- SELECT: public profiles are visible to everyone; private = owner+collaborators only
DROP POLICY IF EXISTS "Public profiles are visible to all" ON public.deceased;
CREATE POLICY "Public profiles are visible to all"
  ON public.deceased FOR SELECT
  USING (
    visibility = 'public'
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.deceased_collaborators dc
      WHERE dc.deceased_id = deceased.id
        AND dc.user_id = auth.uid()
    )
  );

-- INSERT: only authenticated users can create
DROP POLICY IF EXISTS "Auth users can create deceased profiles" ON public.deceased;
CREATE POLICY "Auth users can create deceased profiles"
  ON public.deceased FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- UPDATE: only owner or editor collaborators can update
DROP POLICY IF EXISTS "Owner and editors can update" ON public.deceased;
CREATE POLICY "Owner and editors can update"
  ON public.deceased FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.deceased_collaborators dc
      WHERE dc.deceased_id = deceased.id
        AND dc.user_id = auth.uid()
        AND dc.role = 'editor'
    )
  );

-- DELETE: only owner can delete
DROP POLICY IF EXISTS "Only owner can delete" ON public.deceased;
CREATE POLICY "Only owner can delete"
  ON public.deceased FOR DELETE
  USING (owner_id = auth.uid());

-- ─── 7. RLS POLICIES: COLLABORATORS ───────────────────────────
DROP POLICY IF EXISTS "Owner can manage collaborators" ON public.deceased_collaborators;
CREATE POLICY "Owner can manage collaborators"
  ON public.deceased_collaborators
  USING (
    EXISTS (
      SELECT 1 FROM public.deceased d
      WHERE d.id = deceased_collaborators.deceased_id
        AND d.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Collaborators can view their access" ON public.deceased_collaborators;
CREATE POLICY "Collaborators can view their access"
  ON public.deceased_collaborators FOR SELECT
  USING (user_id = auth.uid());

-- ─── 8. HELPER: Get user's own deceased profiles ──────────────
CREATE OR REPLACE VIEW public.my_deceased AS
  SELECT d.*
  FROM public.deceased d
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
