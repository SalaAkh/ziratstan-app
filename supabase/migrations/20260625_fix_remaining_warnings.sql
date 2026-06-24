-- =============================================================================
-- Ziratstan.kz — Исправление ОСТАВШИХСЯ предупреждений Supabase Advisor
-- Дата: 2026-06-25
-- =============================================================================

BEGIN;

-- ================================================================================
-- 1. PostGIS — переносим в схему extensions
-- Устраняет:
--   - "Extension in Public: public.postgis"
--   - "RLS Disabled in Public: public.spatial_ref_sys"
--   - "SECURITY DEFINER: st_estimatedextent" (функции уйдут из public схемы)
-- ================================================================================

CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
  BEGIN
    ALTER EXTENSION postgis SET SCHEMA extensions;
    RAISE NOTICE 'PostGIS перенесён в схему extensions';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'PostGIS уже в нужной схеме или ошибка: %', SQLERRM;
  END;
END $$;


-- ================================================================================
-- 2. spatial_ref_sys — включаем RLS (если таблица ещё в public)
-- ================================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'spatial_ref_sys'
  ) THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY';
      RAISE NOTICE 'RLS включён на spatial_ref_sys';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Не удалось включить RLS на spatial_ref_sys: % — это нормально', SQLERRM;
    END;
  END IF;
END $$;


-- ================================================================================
-- 3. increment_qr_scan_count — убираем SECURITY DEFINER
-- Предупреждение: "Public Can Execute SECURITY DEFINER Function"
-- ================================================================================

CREATE OR REPLACE FUNCTION public.increment_qr_scan_count(p_qr_id uuid)
RETURNS integer
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_scan_count integer;
BEGIN
  UPDATE public.qr_codes
  SET scan_count = COALESCE(scan_count, 0) + 1
  WHERE id = p_qr_id
    AND status = 'active'
  RETURNING scan_count INTO v_scan_count;

  RETURN COALESCE(v_scan_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_qr_scan_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_qr_scan_count(uuid) TO anon, authenticated, service_role;


-- ================================================================================
-- 4. is_profile_owner — убираем SECURITY DEFINER
-- Предупреждение: "Signed-In Can Execute SECURITY DEFINER Function"
-- ================================================================================

CREATE OR REPLACE FUNCTION public.is_profile_owner(p_profile_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_profile_id AND p.owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.profile_collaborators c
    WHERE c.profile_id = p_profile_id
      AND c.user_id = p_user_id
      AND c.role IN ('admin', 'editor')
  ) OR public.is_admin();
END;
$$;

REVOKE ALL ON FUNCTION public.is_profile_owner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_profile_owner(uuid, uuid) TO authenticated, service_role;


-- ================================================================================
-- 5. PostGIS st_estimatedextent — REVOKE от anon и PUBLIC
-- ================================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'st_estimatedextent' AND pronamespace = 'public'::regnamespace) THEN
    BEGIN EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text) FROM anon, PUBLIC'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) FROM anon, PUBLIC'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM anon, PUBLIC'; EXCEPTION WHEN OTHERS THEN NULL; END;
    RAISE NOTICE 'REVOKE на st_estimatedextent выполнен';
  END IF;
END $$;

COMMIT;
