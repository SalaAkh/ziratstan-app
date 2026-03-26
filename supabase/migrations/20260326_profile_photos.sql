-- ================================================================
-- Migration: profile_photos table + Storage policies
-- Run this SQL in Supabase SQL Editor AFTER creating
-- the Storage bucket named "profile-photos" (set to public)
-- ================================================================

-- 1. Photos metadata table
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id   uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  uploader_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  url          text NOT NULL,
  is_main      boolean NOT NULL DEFAULT false,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Index for fast profile lookups
CREATE INDEX IF NOT EXISTS idx_profile_photos_profile_id ON public.profile_photos(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_photos_uploader   ON public.profile_photos(uploader_id);

-- 2. RLS
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

-- Everyone can read photos of public profiles
CREATE POLICY "photos_select_public" ON public.profile_photos
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE visibility_status = 'public'
    )
    OR uploader_id = auth.uid()
  );

-- Owners can insert their own
CREATE POLICY "photos_insert_own" ON public.profile_photos
  FOR INSERT WITH CHECK (uploader_id = auth.uid());

-- Owners can update their own
CREATE POLICY "photos_update_own" ON public.profile_photos
  FOR UPDATE USING (uploader_id = auth.uid());

-- Owners can delete their own
CREATE POLICY "photos_delete_own" ON public.profile_photos
  FOR DELETE USING (uploader_id = auth.uid());

-- Admins full access
CREATE POLICY "photos_admin_all" ON public.profile_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND raw_app_meta_data->>'role' = 'admin'
    )
  );

-- ================================================================
-- 3. Storage bucket RLS (run AFTER creating bucket "profile-photos")
-- ================================================================

-- Allow authenticated users to upload to their own user folder
CREATE POLICY "storage_profile_photos_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read (bucket should also be set to public)
CREATE POLICY "storage_profile_photos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

-- Allow owners to delete their own uploads
CREATE POLICY "storage_profile_photos_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
