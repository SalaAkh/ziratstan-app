-- Бисмиллях. Исправление ошибки "Профиль не найден" при создании профиля
-- Ошибка была в том, что в недавней миграции в `USING (auth.uid() = id)` сравнивался ID пользователя (uuid) с ID профиля (uuid), что всегда давало false.
-- Заменяем `id` на правильную колонку `owner_id`.

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING ( auth.uid() = owner_id OR (SELECT public.is_admin() = true) );

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING ( auth.uid() = owner_id OR (SELECT public.is_admin() = true) );
