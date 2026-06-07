-- Migration: Add is_premium column to profiles table
-- Бисмиллях, расширяем возможности профилей!
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
