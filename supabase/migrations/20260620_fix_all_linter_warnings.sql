-- =============================================================================
-- Ziratstan.kz — Ядерная миграция: исправление ВСЕХ предупреждений Supabase Linter
-- Дата: 2026-06-20
-- 
-- Стратегия:
-- 1. DROP ALL существующих RLS-политик на КАЖДОЙ таблице
-- 2. Пересоздать ровно по 1 политике на (таблица, операция) — без дубликатов
-- 3. Все auth.uid() обёрнуты в (select auth.uid()) — Auth RLS Initialization Plan
-- 4. is_admin() переписан БЕЗ SECURITY DEFINER (через JWT)
-- 5. Trigger-функции: REVOKE EXECUTE от anon/authenticated
-- 6. spatial_ref_sys: RLS enabled + SELECT
-- 7. Недостающие индексы
-- =============================================================================

BEGIN;

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  PHASE 0: NUCLEAR DROP — удаляем ВСЕ RLS-политики на ВСЕХ таблицах  ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Также удаляем storage-политики для profile-photos, если были дубликаты
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname LIKE '%profile%photo%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  PHASE 1: ФУНКЦИИ — убираем SECURITY DEFINER где можно, фиксим path  ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- ── 1a. is_admin() — БЕЗ SECURITY DEFINER, читаем из JWT ──
-- Это устраняет предупреждение "Public/Signed-In Can Execute SECURITY DEFINER Function"
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- Права: доступна всем ролям (нужна в RLS-политиках для anon-запросов)
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;


-- ── 1b. is_profile_owner() — остаётся SECURITY DEFINER (нужен доступ к таблицам в обход RLS) ──
CREATE OR REPLACE FUNCTION public.is_profile_owner(p_profile_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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

-- Только authenticated (anon не нужен — is_profile_owner не используется в anon-политиках)
REVOKE ALL ON FUNCTION public.is_profile_owner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_profile_owner(uuid, uuid) TO authenticated, service_role;


-- ── 1c. handle_new_user() — trigger-функция, не нужна пользователям ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
-- Trigger-функцию вызывает только движок PostgreSQL, не пользователи


-- ── 1d. enforce_admin_moderation_visibility_lock() — trigger-функция ──
CREATE OR REPLACE FUNCTION public.enforce_admin_moderation_visibility_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  moderation_status text;
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN new;
  END IF;

  IF tg_op = 'UPDATE' AND new.visibility_status IS DISTINCT FROM old.visibility_status THEN
    IF public.is_admin() THEN
      RETURN new;
    END IF;

    SELECT u.status
      INTO moderation_status
    FROM public.ugc_profile_submissions u
    WHERE u.published_profile_id = new.id
    ORDER BY u.submitted_at DESC, u.id DESC
    LIMIT 1;

    IF moderation_status IS NOT NULL AND moderation_status <> 'approved' THEN
      RAISE EXCEPTION 'Visibility is locked by admin moderation status: %', moderation_status
        USING errcode = '42501';
    END IF;
  END IF;

  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_admin_moderation_visibility_lock() FROM PUBLIC;


-- ── 1e. increment_qr_scan_count() — нужен anon (QR-скан без логина) ──
CREATE OR REPLACE FUNCTION public.increment_qr_scan_count(p_qr_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
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


-- ── 1f. rls_auto_enable() — утилита, не нужна пользователям ──
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'rls_auto_enable'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC';
  END IF;
END $$;


-- ── 1g. PostGIS st_estimatedextent — REVOKE от anon ──
DO $$
BEGIN
  -- Проверяем, существуют ли эти функции в public схеме
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'st_estimatedextent' AND pronamespace = 'public'::regnamespace) THEN
    -- 2 аргумента
    BEGIN
      EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text) FROM anon, PUBLIC';
    EXCEPTION WHEN undefined_function THEN NULL;
    END;
    -- 3 аргумента
    BEGIN
      EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) FROM anon, PUBLIC';
    EXCEPTION WHEN undefined_function THEN NULL;
    END;
    -- 4 аргумента
    BEGIN
      EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM anon, PUBLIC';
    EXCEPTION WHEN undefined_function THEN NULL;
    END;
  END IF;
END $$;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  PHASE 2: ENABLE RLS на всех таблицах (идемпотентно)                 ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_photos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_relations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cemeteries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_attachments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ugc_submissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ugc_profile_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ugc_bio_submissions   ENABLE ROW LEVEL SECURITY;

-- spatial_ref_sys (PostGIS) — если существует в public
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'spatial_ref_sys'
  ) THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not enable RLS on spatial_ref_sys: %', SQLERRM;
    END;
  END IF;
END $$;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  PHASE 3: СОЗДАНИЕ ЧИСТЫХ RLS-ПОЛИТИК                               ║
-- ║  Правило: РОВНО 1 политика на (таблица, операция)                    ║
-- ║  Все auth.uid() обёрнуты в (select auth.uid())                       ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- ══════════════════════════════════════
-- TABLE: public.profiles (мемориалы)
-- ══════════════════════════════════════

-- SELECT: публичные видят все, владелец видит свои, коллабораторы, админ
CREATE POLICY "profiles_select"
ON public.profiles FOR SELECT
USING (
  visibility_status = 'public'
  OR (select auth.uid()) = owner_id
  OR EXISTS (
    SELECT 1 FROM public.profile_collaborators c
    WHERE c.profile_id = profiles.id
      AND c.user_id = (select auth.uid())
  )
  OR public.is_admin()
);

-- INSERT: только аутентифицированный пользователь как владелец
CREATE POLICY "profiles_insert"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.uid()) IS NOT NULL
  AND (select auth.uid()) = owner_id
);

-- UPDATE: владелец, коллабораторы (editor/admin), или админ
CREATE POLICY "profiles_update"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  (select auth.uid()) = owner_id
  OR EXISTS (
    SELECT 1 FROM public.profile_collaborators c
    WHERE c.profile_id = profiles.id
      AND c.user_id = (select auth.uid())
      AND c.role IN ('editor', 'admin')
  )
  OR public.is_admin()
)
WITH CHECK (
  (select auth.uid()) = owner_id
  OR EXISTS (
    SELECT 1 FROM public.profile_collaborators c
    WHERE c.profile_id = profiles.id
      AND c.user_id = (select auth.uid())
      AND c.role IN ('editor', 'admin')
  )
  OR public.is_admin()
);

-- DELETE: владелец или админ
CREATE POLICY "profiles_delete"
ON public.profiles FOR DELETE
TO authenticated
USING (
  (select auth.uid()) = owner_id
  OR public.is_admin()
);


-- ══════════════════════════════════════
-- TABLE: public.user_profiles (профили пользователей)
-- ══════════════════════════════════════

CREATE POLICY "user_profiles_select"
ON public.user_profiles FOR SELECT
TO authenticated
USING (
  (select auth.uid()) = user_id
  OR public.is_admin()
);

CREATE POLICY "user_profiles_insert"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "user_profiles_update"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (
  (select auth.uid()) = user_id
  OR public.is_admin()
)
WITH CHECK (
  (select auth.uid()) = user_id
  OR public.is_admin()
);


-- ══════════════════════════════════════
-- TABLE: public.profile_collaborators
-- ══════════════════════════════════════

-- SELECT: ты видишь записи, где ты коллаборатор, или ты владелец профиля
CREATE POLICY "collaborators_select"
ON public.profile_collaborators FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid())
  OR public.is_profile_owner(profile_id, (select auth.uid()))
);

-- INSERT: только владелец профиля может добавить коллаборатора
CREATE POLICY "collaborators_insert"
ON public.profile_collaborators FOR INSERT
TO authenticated
WITH CHECK (
  public.is_profile_owner(profile_id, (select auth.uid()))
);

-- UPDATE: только владелец профиля
CREATE POLICY "collaborators_update"
ON public.profile_collaborators FOR UPDATE
TO authenticated
USING (public.is_profile_owner(profile_id, (select auth.uid())))
WITH CHECK (public.is_profile_owner(profile_id, (select auth.uid())));

-- DELETE: только владелец профиля
CREATE POLICY "collaborators_delete"
ON public.profile_collaborators FOR DELETE
TO authenticated
USING (public.is_profile_owner(profile_id, (select auth.uid())));


-- ══════════════════════════════════════
-- TABLE: public.profile_photos
-- ══════════════════════════════════════

-- SELECT: фото публичных профилей, загрузчик, или админ
CREATE POLICY "profile_photos_select"
ON public.profile_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_photos.profile_id
      AND p.visibility_status = 'public'
  )
  OR (select auth.uid()) = uploader_id
  OR public.is_admin()
);

-- INSERT: загрузчик = текущий пользователь
CREATE POLICY "profile_photos_insert"
ON public.profile_photos FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = uploader_id);

-- UPDATE: загрузчик или админ
CREATE POLICY "profile_photos_update"
ON public.profile_photos FOR UPDATE
TO authenticated
USING (
  (select auth.uid()) = uploader_id
  OR public.is_admin()
)
WITH CHECK (
  (select auth.uid()) = uploader_id
  OR public.is_admin()
);

-- DELETE: загрузчик или админ
CREATE POLICY "profile_photos_delete"
ON public.profile_photos FOR DELETE
TO authenticated
USING (
  (select auth.uid()) = uploader_id
  OR public.is_admin()
);


-- ══════════════════════════════════════
-- TABLE: public.profile_relations (шежіре)
-- ══════════════════════════════════════

-- SELECT: публичные данные (родственные связи не содержат PII)
CREATE POLICY "relations_select"
ON public.profile_relations FOR SELECT
USING (true);

-- INSERT: владелец одного из профилей или админ
CREATE POLICY "relations_insert"
ON public.profile_relations FOR INSERT
TO authenticated
WITH CHECK (
  public.is_profile_owner(profile_id_1, (select auth.uid()))
  OR public.is_profile_owner(profile_id_2, (select auth.uid()))
  OR public.is_admin()
);

-- UPDATE: владелец одного из профилей или админ
CREATE POLICY "relations_update"
ON public.profile_relations FOR UPDATE
TO authenticated
USING (
  public.is_profile_owner(profile_id_1, (select auth.uid()))
  OR public.is_profile_owner(profile_id_2, (select auth.uid()))
  OR public.is_admin()
)
WITH CHECK (
  public.is_profile_owner(profile_id_1, (select auth.uid()))
  OR public.is_profile_owner(profile_id_2, (select auth.uid()))
  OR public.is_admin()
);

-- DELETE: владелец одного из профилей или админ
CREATE POLICY "relations_delete"
ON public.profile_relations FOR DELETE
TO authenticated
USING (
  public.is_profile_owner(profile_id_1, (select auth.uid()))
  OR public.is_profile_owner(profile_id_2, (select auth.uid()))
  OR public.is_admin()
);


-- ══════════════════════════════════════
-- TABLE: public.admin_sessions
-- ══════════════════════════════════════

-- Все операции: только админ + только свои сессии
CREATE POLICY "admin_sessions_select"
ON public.admin_sessions FOR SELECT
TO authenticated
USING (public.is_admin() AND user_id = (select auth.uid()));

CREATE POLICY "admin_sessions_insert"
ON public.admin_sessions FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() AND user_id = (select auth.uid()));

CREATE POLICY "admin_sessions_update"
ON public.admin_sessions FOR UPDATE
TO authenticated
USING (public.is_admin() AND user_id = (select auth.uid()))
WITH CHECK (public.is_admin() AND user_id = (select auth.uid()));

CREATE POLICY "admin_sessions_delete"
ON public.admin_sessions FOR DELETE
TO authenticated
USING (public.is_admin() AND user_id = (select auth.uid()));


-- ══════════════════════════════════════
-- TABLE: public.qr_codes
-- ══════════════════════════════════════

-- SELECT: публичные (нужно для скана QR)
CREATE POLICY "qr_codes_select"
ON public.qr_codes FOR SELECT
USING (true);

-- INSERT/UPDATE/DELETE: только админ
CREATE POLICY "qr_codes_insert"
ON public.qr_codes FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "qr_codes_update"
ON public.qr_codes FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "qr_codes_delete"
ON public.qr_codes FOR DELETE
TO authenticated
USING (public.is_admin());


-- ══════════════════════════════════════
-- TABLE: public.cemeteries
-- ══════════════════════════════════════

-- SELECT: публичные (карта кладбищ)
CREATE POLICY "cemeteries_select"
ON public.cemeteries FOR SELECT
USING (true);

-- INSERT/UPDATE/DELETE: только админ
CREATE POLICY "cemeteries_insert"
ON public.cemeteries FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "cemeteries_update"
ON public.cemeteries FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "cemeteries_delete"
ON public.cemeteries FOR DELETE
TO authenticated
USING (public.is_admin());


-- ══════════════════════════════════════
-- TABLE: public.media_attachments
-- ══════════════════════════════════════

-- SELECT: публичные (галерея)
CREATE POLICY "media_select"
ON public.media_attachments FOR SELECT
USING (true);

-- INSERT: владелец профиля или админ
CREATE POLICY "media_insert"
ON public.media_attachments FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR (profile_id IS NOT NULL AND public.is_profile_owner(profile_id, (select auth.uid())))
);

-- UPDATE: владелец профиля или админ
CREATE POLICY "media_update"
ON public.media_attachments FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR (profile_id IS NOT NULL AND public.is_profile_owner(profile_id, (select auth.uid())))
)
WITH CHECK (
  public.is_admin()
  OR (profile_id IS NOT NULL AND public.is_profile_owner(profile_id, (select auth.uid())))
);

-- DELETE: только админ
CREATE POLICY "media_delete"
ON public.media_attachments FOR DELETE
TO authenticated
USING (public.is_admin());


-- ══════════════════════════════════════
-- TABLE: public.services_orders
-- ══════════════════════════════════════
-- У таблицы НЕТ колонки user_id — это заказы, которые создаёт и ведёт только админ

CREATE POLICY "services_orders_select"
ON public.services_orders FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "services_orders_insert"
ON public.services_orders FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "services_orders_update"
ON public.services_orders FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "services_orders_delete"
ON public.services_orders FOR DELETE
TO authenticated
USING (public.is_admin());


-- ══════════════════════════════════════
-- TABLE: public.services_leads (публичные заявки)
-- ══════════════════════════════════════

-- SELECT: только админ
CREATE POLICY "services_leads_select"
ON public.services_leads FOR SELECT
TO authenticated
USING (public.is_admin());

-- INSERT: любой может оставить заявку (публичная форма) — проверяем service_type
CREATE POLICY "services_leads_insert"
ON public.services_leads FOR INSERT
TO anon, authenticated
WITH CHECK (service_type IS NOT NULL AND customer_name IS NOT NULL AND customer_phone IS NOT NULL);

-- UPDATE: только админ
CREATE POLICY "services_leads_update"
ON public.services_leads FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ══════════════════════════════════════
-- TABLE: public.ugc_submissions (предложения названий кладбищ)
-- ══════════════════════════════════════
-- У таблицы НЕТ user_id — анонимные предложения

-- SELECT: только админ
CREATE POLICY "ugc_submissions_select"
ON public.ugc_submissions FOR SELECT
TO authenticated
USING (public.is_admin());

-- INSERT: любой может предложить
CREATE POLICY "ugc_submissions_insert"
ON public.ugc_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (COALESCE(status, 'pending') = 'pending');

-- UPDATE: только админ (модерация)
CREATE POLICY "ugc_submissions_update"
ON public.ugc_submissions FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ══════════════════════════════════════
-- TABLE: public.ugc_profile_submissions (предложения профилей)
-- ══════════════════════════════════════

-- SELECT: автор видит свои, админ видит все
CREATE POLICY "ugc_profile_submissions_select"
ON public.ugc_profile_submissions FOR SELECT
TO authenticated
USING (
  (select auth.uid()) = owner_id
  OR public.is_admin()
);

-- INSERT: любой может предложить (status = pending, owner_id = свой или null)
CREATE POLICY "ugc_profile_submissions_insert"
ON public.ugc_profile_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (
  COALESCE(status, 'pending') = 'pending'
  AND (owner_id IS NULL OR (select auth.uid()) = owner_id)
);

-- UPDATE: только админ
CREATE POLICY "ugc_profile_submissions_update"
ON public.ugc_profile_submissions FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ══════════════════════════════════════
-- TABLE: public.ugc_bio_submissions (предложения биографий)
-- ══════════════════════════════════════
-- У таблицы НЕТ user_id — анонимные предложения

-- SELECT: только админ
CREATE POLICY "ugc_bio_submissions_select"
ON public.ugc_bio_submissions FOR SELECT
TO authenticated
USING (public.is_admin());

-- INSERT: любой может предложить
CREATE POLICY "ugc_bio_submissions_insert"
ON public.ugc_bio_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (COALESCE(status, 'pending') = 'pending');

-- UPDATE: только админ
CREATE POLICY "ugc_bio_submissions_update"
ON public.ugc_bio_submissions FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ══════════════════════════════════════
-- TABLE: public.spatial_ref_sys (PostGIS)
-- ══════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'spatial_ref_sys'
  ) THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY';
      EXECUTE 'CREATE POLICY "spatial_ref_sys_select" ON public.spatial_ref_sys FOR SELECT USING (true)';
    EXCEPTION WHEN OTHERS THEN
      -- Игнорируем ошибку 42501 (must be owner of table spatial_ref_sys)
      -- Эта таблица управляется самим Supabase/PostGIS
      RAISE NOTICE 'Could not alter spatial_ref_sys: %', SQLERRM;
    END;
  END IF;
END $$;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  PHASE 4: STORAGE POLICIES для profile-photos                        ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Upload: аутентифицированный пользователь в свою папку
CREATE POLICY "storage_photos_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Read: все могут читать (бакет публичный)
CREATE POLICY "storage_photos_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Delete: только свои загрузки
CREATE POLICY "storage_photos_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
);


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  PHASE 5: ИНДЕКСЫ                                                    ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Недостающий FK индекс (Unindexed Foreign Keys)
CREATE INDEX IF NOT EXISTS idx_profiles_cemetery_id ON public.profiles(cemetery_id);

-- Индексы, которые ДОЛЖНЫ существовать (для RLS-политик и запросов)
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_profiles_owner_id ON public.profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_slug ON public.qr_codes(slug);
CREATE INDEX IF NOT EXISTS idx_profile_photos_profile_id ON public.profile_photos(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_photos_uploader ON public.profile_photos(uploader_id);
CREATE INDEX IF NOT EXISTS idx_profile_collab_profile_id ON public.profile_collaborators(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_collab_user_id ON public.profile_collaborators(user_id);


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  PHASE 6: TABLE GRANTS (чтобы роли могли вообще обращаться к таблицам)║
-- ╚═══════════════════════════════════════════════════════════════════════╝

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON TABLE public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.user_profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profile_collaborators TO authenticated;

GRANT SELECT ON TABLE public.profile_photos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.profile_photos TO authenticated;

GRANT SELECT ON TABLE public.profile_relations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.profile_relations TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admin_sessions TO authenticated;

GRANT SELECT ON TABLE public.qr_codes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.qr_codes TO authenticated;

GRANT SELECT ON TABLE public.cemeteries TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.cemeteries TO authenticated;

GRANT SELECT ON TABLE public.media_attachments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.media_attachments TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.services_orders TO authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.services_leads TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.ugc_submissions TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.ugc_profile_submissions TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.ugc_bio_submissions TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  ГОТОВО! 🎉                                                          ║
-- ║                                                                      ║
-- ║  Что нужно сделать ВРУЧНУЮ в Supabase Dashboard:                     ║
-- ║  1. Auth → Settings → Enable "Leaked Password Protection"            ║
-- ║  2. Storage → profile-photos → отключить "Allow public listing"      ║
-- ║     (или сделать бакет приватным и использовать signed URLs)          ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

COMMIT;
