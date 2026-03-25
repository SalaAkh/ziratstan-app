-- Исправление ошибки 403 Permission Denied для user_profiles

-- 1. Выдача базовых прав к таблице для ролей API
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_profiles TO anon, authenticated;

-- 2. Включение RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Удаление старых конфликтующих политик (если они есть)
DROP POLICY IF EXISTS "user_read_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "user_manage_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_self_read" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_self_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_self_update" ON public.user_profiles;

-- 4. Создание чистых, правильных политик
CREATE POLICY "user_profiles_self_read" 
ON public.user_profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR (SELECT public.is_admin() = true));

CREATE POLICY "user_profiles_self_insert" 
ON public.user_profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_self_update" 
ON public.user_profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id OR (SELECT public.is_admin() = true))
WITH CHECK (auth.uid() = user_id OR (SELECT public.is_admin() = true));
