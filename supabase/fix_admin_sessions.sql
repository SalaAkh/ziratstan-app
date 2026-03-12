-- Фикс RLS для admin_sessions (чтобы админский скрипт admin.js работал и не сыпал 403 Forbidden)
-- Мы добавили проверку: либо это твоя сессия (user_id = auth.uid()), либо запрос идет от Service Role (Firebase/backend), либо ты админ (is_admin()).

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_own_admin_sessions" ON public.admin_sessions;

-- Политика для ЧТЕНИЯ: админ может читать все сессии, владелец может читать свои сессии
CREATE POLICY "admin_own_admin_sessions_select" 
ON public.admin_sessions 
FOR SELECT 
TO authenticated 
USING (public.is_admin() OR user_id = auth.uid());

-- Политика для ОБНОВЛЕНИЯ/ВСТАВКИ: админ или владелец сессии может модифицировать свои записи
CREATE POLICY "admin_own_admin_sessions_update" 
ON public.admin_sessions 
FOR ALL 
TO authenticated 
USING (public.is_admin() OR user_id = auth.uid()) 
WITH CHECK (public.is_admin() OR user_id = auth.uid());
