-- 1. Сделаем тебя администратором
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE email = 'epicgamesakkauntaboba@gmail.com';

-- 2. Включаем RLS для таблицы user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Политики для user_profiles
DROP POLICY IF EXISTS "user_read_own_profile" ON public.user_profiles;
CREATE POLICY "user_read_own_profile"
ON public.user_profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "user_manage_own_profile" ON public.user_profiles;
CREATE POLICY "user_manage_own_profile"
ON public.user_profiles FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 4. Политики для profiles
DROP POLICY IF EXISTS "owner_manage_profiles" ON public.profiles;
CREATE POLICY "owner_manage_profiles"
ON public.profiles FOR ALL TO authenticated
USING (auth.uid() = owner_id OR public.is_admin())
WITH CHECK (auth.uid() = owner_id OR public.is_admin());

-- 5. Фиксы для Supabase Linter (Security)

-- Фикс: Function Search Path Mutable для функции is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''  -- <-- Вот это решает Linter Warning про search_path
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
      AND coalesce(u.raw_app_meta_data ->> 'role', '') = 'admin'
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Фикс: RLS Disabled in Public для PostGIS таблицы spatial_ref_sys
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spatial_ref_sys_select" ON public.spatial_ref_sys;
CREATE POLICY "spatial_ref_sys_select" ON public.spatial_ref_sys
FOR SELECT TO public USING (true); -- Только чтение для всех

-- Фикс: RLS Policy Always True для services_leads
-- Мы удаляем публичную вставку, так как теперь данные идут безопасно (если потребуется, мы можем вернуть ее, но линтеру это не нравится).
DROP POLICY IF EXISTS "public_submit_services_leads" ON public.services_leads;
CREATE POLICY "public_submit_services_leads"
ON public.services_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true); -- Линтер будет ворчать, но нам это реально НУЖНО для публичной формы заявок без аутентификации. Если хочешь чтобы линтер молчал, удали эту CREATE POLICY.
