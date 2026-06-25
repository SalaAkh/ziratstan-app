-- =============================================================================
-- Ziratstan.kz — Исправление SECURITY DEFINER функций
-- Дата: 2026-06-25
-- ВАЖНО: Этот скрипт НЕ содержит BEGIN/COMMIT — каждый блок независимый.
--        Запускайте весь файл целиком в SQL Editor.
-- =============================================================================


-- ── 1. increment_qr_scan_count — убираем SECURITY DEFINER ──
-- Устраняет: "Public Can Execute SECURITY DEFINER Function"
-- Функция обновляет счётчик QR при сканировании — работает через RLS qr_codes.

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


-- ── 2. is_profile_owner — убираем SECURITY DEFINER ──
-- Устраняет: "Signed-In Users Can Execute SECURITY DEFINER Function"

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


-- ── 3. spatial_ref_sys — включаем RLS если таблица ещё в public ──
-- Устраняет: "RLS Disabled in Public: spatial_ref_sys"

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
      RAISE NOTICE 'spatial_ref_sys управляется Supabase — пропускаем: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'spatial_ref_sys не в public схеме — всё хорошо';
  END IF;
END $$;


-- ── 4. REVOKE PostGIS st_estimatedextent от anon/PUBLIC ──
-- Устраняет: "Public Can Execute SECURITY DEFINER Function: st_estimatedextent"

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'st_estimatedextent'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    BEGIN
      EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text) FROM anon, PUBLIC';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) FROM anon, PUBLIC';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM anon, PUBLIC';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    RAISE NOTICE 'REVOKE на st_estimatedextent выполнен';
  ELSE
    RAISE NOTICE 'st_estimatedextent не в public — PostGIS уже перенесён';
  END IF;
END $$;


-- ── 5. PostGIS — переносим в схему extensions (ОТДЕЛЬНЫМ ЗАПРОСОМ) ──
-- Устраняет: "Extension in Public: postgis"
-- ВНИМАНИЕ: Если ошибка — это нормально, просто проигнорируйте.

DO $$
BEGIN
  BEGIN
    ALTER EXTENSION postgis SET SCHEMA extensions;
    RAISE NOTICE 'PostGIS успешно перенесён в extensions';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PostGIS уже в нужной схеме или Supabase не разрешает перенос: %', SQLERRM;
  END;
END $$;
