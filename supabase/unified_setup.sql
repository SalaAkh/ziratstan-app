-- =============================================================================
-- ZIRATSTAN.KZ — Полный унифицированный скрипт восстановления базы данных Supabase
-- Инструкция: Скопируйте и выполните весь этот скрипт в Supabase SQL Editor.
-- Перед выполнением убедитесь, что вы создали бакет "profile-photos" в Storage!
-- =============================================================================

BEGIN;

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  ЭТАП 1: ИНИЦИАЛИЗАЦИЯ СХЕМ И РАСШИРЕНИЙ                              ║
-- ╚═══════════════════════════════════════════════════════════════════════╝
CREATE SCHEMA IF NOT EXISTS "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "postgis" SCHEMA "extensions";

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  ЭТАП 2: СОЗДАНИЕ ТАБЛИЦ                                              ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- 1. Таблица Кладбищ (Cemeteries)
CREATE TABLE IF NOT EXISTS public.cemeteries (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  boundary extensions.GEOMETRY(Polygon, 4326),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Таблица Профилей / Мемориалов (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  patronymic VARCHAR(100),
  birth_date DATE,
  death_date DATE,
  epitaph TEXT,
  biography TEXT,
  shezhire_entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  cemetery_id UUID REFERENCES public.cemeteries(id) ON DELETE SET NULL,
  location extensions.GEOMETRY(Point, 4326),
  main_photo_url TEXT,
  visibility_status VARCHAR(20) DEFAULT 'public' CHECK (visibility_status IN ('public', 'family_only', 'private')),
  pin_code VARCHAR(4),
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Таблица Профилей Пользователей (User Profiles)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Таблица QR-кодов (QR Codes)
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  scan_count INTEGER DEFAULT 0,
  activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Таблица Медиа галереи (Media Gallery)
CREATE TABLE IF NOT EXISTS public.media_attachments (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'audio', 'document')),
  file_url TEXT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Таблица Услуг по уходу (Cemetery Services)
CREATE TABLE IF NOT EXISTS public.services_orders (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  service_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  price DECIMAL(10, 2) NOT NULL,
  report_photo_before_url TEXT,
  report_photo_after_url TEXT,
  report_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 7. Таблица Родственных связей (Family Tree Relations)
CREATE TABLE IF NOT EXISTS public.profile_relations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  profile_id_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_id_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relation_type VARCHAR(50) NOT NULL CHECK (relation_type IN ('parent', 'child', 'spouse', 'sibling')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. UGC: Предложения пользователей о названиях кладбищ
CREATE TABLE IF NOT EXISTS public.ugc_submissions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  cemetery_id VARCHAR(255),
  current_name VARCHAR(255),
  suggested_name VARCHAR(255) NOT NULL,
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),
  comment TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Лиды заявок на услуги (Монетизация)
CREATE TABLE IF NOT EXISTS public.services_leads (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  service_type VARCHAR(50) NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  profile_ref VARCHAR(255),
  comment TEXT,
  price DECIMAL(10, 2),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. UGC: Предложения пользователей по добавлению новых личностей
CREATE TABLE IF NOT EXISTS public.ugc_profile_submissions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cemetery_id VARCHAR(255),
  cemetery_name VARCHAR(255),
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),
  full_name VARCHAR(255) NOT NULL,
  birth_year VARCHAR(50),
  death_year VARCHAR(50),
  description TEXT,
  shezhire_entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  published_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. UGC: Предложения пользователей по дополнению биографий
CREATE TABLE IF NOT EXISTS public.ugc_bio_submissions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  profile_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(255),
  bio_text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Коллабораторы для мемориалов (Profile Collaborators)
CREATE TABLE IF NOT EXISTS public.profile_collaborators (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'editor' CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, user_id)
);

-- 13. Дополнительные фото профилей (Profile Photos)
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  is_main BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Админ-сессии (Admin Sessions)
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id BIGSERIAL PRIMARY KEY,
  track_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  email TEXT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT NULL,
  user_agent TEXT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE NULL,
  end_reason TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  ЭТАП 3: СОЗДАНИЕ ВСПУТСТВЕННЫХ ФУНКЦИЙ И ТРИГГЕРОВ                  ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- ── 1. Проверка роли админа ──
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

-- ── 2. Проверка владения мемориальным профилем ──
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

-- ── 3. Триггер-функция для автоматического создания профиля пользователя ──
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

-- Назначение триггера на auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 4. Замок модерации видимости (enforce visibility lock) ──
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

-- Назначение триггера блокировки видимости
DROP TRIGGER IF EXISTS trg_enforce_admin_moderation_visibility_lock ON public.profiles;
CREATE TRIGGER trg_enforce_admin_moderation_visibility_lock
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_moderation_visibility_lock();

-- ── 5. Атомарное увеличение счетчика сканирований QR ──
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

-- Назначение прав выполнения на функции
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_profile_owner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_profile_owner(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.enforce_admin_moderation_visibility_lock() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_admin_moderation_visibility_lock() FROM anon, authenticated;

-- Удаляем rls_auto_enable() если осталась от старой базы
DROP EVENT TRIGGER IF EXISTS ensure_rls;
DROP FUNCTION IF EXISTS public.rls_auto_enable() CASCADE;

REVOKE ALL ON FUNCTION public.increment_qr_scan_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_qr_scan_count(uuid) TO anon, authenticated, service_role;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  ЭТАП 4: ВКЛЮЧЕНИЕ RLS НА ВСЕХ ТАБЛИЦАХ                               ║
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

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  ЭТАП 5: RLS ПОЛИТИКИ ДЛЯ ТАБЛИЦ                                      ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Автоматически удаляем все существующие RLS-политики на таблицах public схемы,
-- чтобы скрипт можно было без ошибок перезапускать повторно (идемпотентность).
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

-- ── 1. public.profiles (мемориалы) ──
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (
  visibility_status = 'public'
  OR (select auth.uid()) = owner_id
  OR EXISTS (
    SELECT 1 FROM public.profile_collaborators c
    WHERE c.profile_id = profiles.id AND c.user_id = (select auth.uid())
  )
  OR public.is_admin()
);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (
  (select auth.uid()) IS NOT NULL AND (select auth.uid()) = owner_id
);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (
  (select auth.uid()) = owner_id
  OR EXISTS (
    SELECT 1 FROM public.profile_collaborators c
    WHERE c.profile_id = profiles.id AND c.user_id = (select auth.uid()) AND c.role IN ('editor', 'admin')
  )
  OR public.is_admin()
) WITH CHECK (
  (select auth.uid()) = owner_id
  OR EXISTS (
    SELECT 1 FROM public.profile_collaborators c
    WHERE c.profile_id = profiles.id AND c.user_id = (select auth.uid()) AND c.role IN ('editor', 'admin')
  )
  OR public.is_admin()
);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated USING (
  (select auth.uid()) = owner_id OR public.is_admin()
);

-- ── 2. public.user_profiles (данные пользователей) ──
CREATE POLICY "user_profiles_select" ON public.user_profiles FOR SELECT TO authenticated USING (
  (select auth.uid()) = user_id OR public.is_admin()
);
CREATE POLICY "user_profiles_insert" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (
  (select auth.uid()) = user_id
);
CREATE POLICY "user_profiles_update" ON public.user_profiles FOR UPDATE TO authenticated USING (
  (select auth.uid()) = user_id OR public.is_admin()
) WITH CHECK (
  (select auth.uid()) = user_id OR public.is_admin()
);

-- ── 3. public.profile_collaborators (соавторы) ──
CREATE POLICY "collaborators_select" ON public.profile_collaborators FOR SELECT TO authenticated USING (
  user_id = (select auth.uid()) OR public.is_profile_owner(profile_id, (select auth.uid()))
);
CREATE POLICY "collaborators_insert" ON public.profile_collaborators FOR INSERT TO authenticated WITH CHECK (
  public.is_profile_owner(profile_id, (select auth.uid()))
);
CREATE POLICY "collaborators_update" ON public.profile_collaborators FOR UPDATE TO authenticated USING (
  public.is_profile_owner(profile_id, (select auth.uid()))
) WITH CHECK (
  public.is_profile_owner(profile_id, (select auth.uid()))
);
CREATE POLICY "collaborators_delete" ON public.profile_collaborators FOR DELETE TO authenticated USING (
  public.is_profile_owner(profile_id, (select auth.uid()))
);

-- ── 4. public.profile_photos (дополнительные фото) ──
CREATE POLICY "profile_photos_select" ON public.profile_photos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_photos.profile_id AND p.visibility_status = 'public'
  )
  OR (select auth.uid()) = uploader_id
  OR public.is_admin()
);
CREATE POLICY "profile_photos_insert" ON public.profile_photos FOR INSERT TO authenticated WITH CHECK (
  (select auth.uid()) = uploader_id
);
CREATE POLICY "profile_photos_update" ON public.profile_photos FOR UPDATE TO authenticated USING (
  (select auth.uid()) = uploader_id OR public.is_admin()
) WITH CHECK (
  (select auth.uid()) = uploader_id OR public.is_admin()
);
CREATE POLICY "profile_photos_delete" ON public.profile_photos FOR DELETE TO authenticated USING (
  (select auth.uid()) = uploader_id OR public.is_admin()
);

-- ── 5. public.profile_relations (родственные связи) ──
CREATE POLICY "relations_select" ON public.profile_relations FOR SELECT USING (true);
CREATE POLICY "relations_insert" ON public.profile_relations FOR INSERT TO authenticated WITH CHECK (
  public.is_profile_owner(profile_id_1, (select auth.uid()))
  OR public.is_profile_owner(profile_id_2, (select auth.uid()))
  OR public.is_admin()
);
CREATE POLICY "relations_update" ON public.profile_relations FOR UPDATE TO authenticated USING (
  public.is_profile_owner(profile_id_1, (select auth.uid()))
  OR public.is_profile_owner(profile_id_2, (select auth.uid()))
  OR public.is_admin()
) WITH CHECK (
  public.is_profile_owner(profile_id_1, (select auth.uid()))
  OR public.is_profile_owner(profile_id_2, (select auth.uid()))
  OR public.is_admin()
);
CREATE POLICY "relations_delete" ON public.profile_relations FOR DELETE TO authenticated USING (
  public.is_profile_owner(profile_id_1, (select auth.uid()))
  OR public.is_profile_owner(profile_id_2, (select auth.uid()))
  OR public.is_admin()
);

-- ── 6. public.admin_sessions (административные сессии) ──
CREATE POLICY "admin_sessions_select" ON public.admin_sessions FOR SELECT TO authenticated USING (
  public.is_admin() AND user_id = (select auth.uid())
);
CREATE POLICY "admin_sessions_insert" ON public.admin_sessions FOR INSERT TO authenticated WITH CHECK (
  public.is_admin() AND user_id = (select auth.uid())
);
CREATE POLICY "admin_sessions_update" ON public.admin_sessions FOR UPDATE TO authenticated USING (
  public.is_admin() AND user_id = (select auth.uid())
) WITH CHECK (
  public.is_admin() AND user_id = (select auth.uid())
);
CREATE POLICY "admin_sessions_delete" ON public.admin_sessions FOR DELETE TO authenticated USING (
  public.is_admin() AND user_id = (select auth.uid())
);

-- ── 7. public.qr_codes ──
CREATE POLICY "qr_codes_select" ON public.qr_codes FOR SELECT USING (true);
CREATE POLICY "qr_codes_insert" ON public.qr_codes FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "qr_codes_update" ON public.qr_codes FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "qr_codes_delete" ON public.qr_codes FOR DELETE TO authenticated USING (public.is_admin());

-- ── 8. public.cemeteries (кладбища) ──
CREATE POLICY "cemeteries_select" ON public.cemeteries FOR SELECT USING (true);
CREATE POLICY "cemeteries_insert" ON public.cemeteries FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "cemeteries_update" ON public.cemeteries FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "cemeteries_delete" ON public.cemeteries FOR DELETE TO authenticated USING (public.is_admin());

-- ── 9. public.media_attachments (медиа) ──
CREATE POLICY "media_select" ON public.media_attachments FOR SELECT USING (true);
CREATE POLICY "media_insert" ON public.media_attachments FOR INSERT TO authenticated WITH CHECK (
  public.is_admin() OR (profile_id IS NOT NULL AND public.is_profile_owner(profile_id, (select auth.uid())))
);
CREATE POLICY "media_update" ON public.media_attachments FOR UPDATE TO authenticated USING (
  public.is_admin() OR (profile_id IS NOT NULL AND public.is_profile_owner(profile_id, (select auth.uid())))
) WITH CHECK (
  public.is_admin() OR (profile_id IS NOT NULL AND public.is_profile_owner(profile_id, (select auth.uid())))
);
CREATE POLICY "media_delete" ON public.media_attachments FOR DELETE TO authenticated USING (public.is_admin());

-- ── 10. public.services_orders (заказы услуг) ──
CREATE POLICY "services_orders_select" ON public.services_orders FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "services_orders_insert" ON public.services_orders FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "services_orders_update" ON public.services_orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "services_orders_delete" ON public.services_orders FOR DELETE TO authenticated USING (public.is_admin());

-- ── 11. public.services_leads (заявки) ──
CREATE POLICY "services_leads_select" ON public.services_leads FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "services_leads_insert" ON public.services_leads FOR INSERT TO anon, authenticated WITH CHECK (
  service_type IS NOT NULL AND customer_name IS NOT NULL AND customer_phone IS NOT NULL
);
CREATE POLICY "services_leads_update" ON public.services_leads FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 12. public.ugc_submissions (предложения названий кладбищ) ──
CREATE POLICY "ugc_submissions_select" ON public.ugc_submissions FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "ugc_submissions_insert" ON public.ugc_submissions FOR INSERT TO anon, authenticated WITH CHECK (COALESCE(status, 'pending') = 'pending');
CREATE POLICY "ugc_submissions_update" ON public.ugc_submissions FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 13. public.ugc_profile_submissions (предложения профилей) ──
CREATE POLICY "ugc_profile_submissions_select" ON public.ugc_profile_submissions FOR SELECT TO authenticated USING (
  (select auth.uid()) = owner_id OR public.is_admin()
);
CREATE POLICY "ugc_profile_submissions_insert" ON public.ugc_profile_submissions FOR INSERT TO anon, authenticated WITH CHECK (
  COALESCE(status, 'pending') = 'pending' AND (owner_id IS NULL OR (select auth.uid()) = owner_id)
);
CREATE POLICY "ugc_profile_submissions_update" ON public.ugc_profile_submissions FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 14. public.ugc_bio_submissions (предложения биографий) ──
CREATE POLICY "ugc_bio_submissions_select" ON public.ugc_bio_submissions FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "ugc_bio_submissions_insert" ON public.ugc_bio_submissions FOR INSERT TO anon, authenticated WITH CHECK (COALESCE(status, 'pending') = 'pending');
CREATE POLICY "ugc_bio_submissions_update" ON public.ugc_bio_submissions FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  ЭТАП 6: ПРАВА ДОСТУПА НА ТАБЛИЦЫ (GRANTS)                            ║
-- ╚═══════════════════════════════════════════════════════════════════════╝
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Важно: анонимные пользователи должны иметь права SELECT на таблицы со связями,
-- чтобы политики не выдавали ошибку 403 / permission denied при проверках RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profile_collaborators TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profile_photos TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profile_relations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admin_sessions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.qr_codes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cemeteries TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.media_attachments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.services_orders TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.services_leads TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ugc_submissions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ugc_profile_submissions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ugc_bio_submissions TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  ЭТАП 7: ИНДЕКСЫ                                                      ║
-- ╚═══════════════════════════════════════════════════════════════════════╝
CREATE INDEX IF NOT EXISTS idx_profiles_cemetery_id ON public.profiles(cemetery_id);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_profiles_owner_id ON public.profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_slug ON public.qr_codes(slug);
CREATE INDEX IF NOT EXISTS idx_profile_photos_profile_id ON public.profile_photos(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_photos_uploader ON public.profile_photos(uploader_id);
CREATE INDEX IF NOT EXISTS idx_profile_collab_profile_id ON public.profile_collaborators(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_collab_user_id ON public.profile_collaborators(user_id);


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  ЭТАП 8: ПРЕДСТАВЛЕНИЯ (COMPLIANCE VIEWS)                             ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- 1. Представление для сессий администратора (скрываем точные Email)
CREATE OR REPLACE VIEW admin_sessions_masked
WITH (security_invoker = true) AS
SELECT 
    id,
    track_id,
    user_id,
    CASE 
        WHEN email IS NULL THEN NULL
        WHEN position('@' IN email) = 0 THEN email
        ELSE 
            substring(split_part(email, '@', 1) from 1 for 1) || 
            '***' || 
            substring(split_part(email, '@', 1) from length(split_part(email, '@', 1)) for 1) || 
            '@' || 
            split_part(email, '@', 2)
    END AS masked_email,
    device_name,
    user_agent,
    started_at,
    last_seen_at,
    ended_at,
    end_reason
FROM 
    admin_sessions;

GRANT SELECT ON admin_sessions_masked TO authenticated;

-- 2. Представление для заказов/лидов (скрываем Полный Телефон)
CREATE OR REPLACE VIEW services_leads_masked
WITH (security_invoker = true) AS
SELECT 
    id,
    service_type,
    customer_name,
    CASE 
        WHEN customer_phone IS NULL THEN NULL
        WHEN length(regexp_replace(customer_phone, '\D', '', 'g')) < 10 THEN customer_phone
        ELSE 
            substring(regexp_replace(customer_phone, '\D', '', 'g') from 1 for 5) || 
            ' *** ** ' || 
            substring(regexp_replace(customer_phone, '\D', '', 'g') from (length(regexp_replace(customer_phone, '\D', '', 'g')) - 1) for 2)
    END AS masked_phone,
    profile_ref,
    price,
    comment,
    submitted_at,
    'pending'::text as status
FROM 
    services_leads;

GRANT SELECT ON services_leads_masked TO authenticated;

-- 3. Представление моих профилей
CREATE OR REPLACE VIEW public.my_profiles
WITH (security_invoker = true) AS
  SELECT p.*
  FROM public.profiles p
  WHERE p.owner_id = auth.uid()
  ORDER BY p.created_at DESC;

GRANT SELECT ON public.my_profiles TO authenticated;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  ЭТАП 9: STORAGE POLICIES ДЛЯ BUCKET "profile-photos"                 ║
-- ║  (Бакет должен быть создан вручную в Supabase Storage)                ║
-- ╚═══════════════════════════════════════════════════════════════════════╝
DROP POLICY IF EXISTS "storage_photos_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_photos_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_photos_delete" ON storage.objects;

-- Загрузка: только авторизованные в свои папки
CREATE POLICY "storage_photos_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Удаление: только свои
CREATE POLICY "storage_photos_delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = (select auth.uid())::text
);

COMMIT;
