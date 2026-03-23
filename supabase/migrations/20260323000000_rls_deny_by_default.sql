-- Миграция Ziratstan: Изоляция базы данных и внедрение RLS
-- Security compliance: Deny by Default (Constitutional Right to Privacy art. 21)

-- 1. Включаем RLS на всех таблицах с персональными данными
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deceased_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Удаляем все старые "разрешающие" политики (если они были публичными)
-- DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- 3. Создаем строгие политики (Deny by default работает автоматически при включенном RLS)

-- Доступ только через сервисный бэкенд (Edge Functions/Next.js).
-- Клиенты (PWA) больше не могут делать прямые запросы к персональным данным.
-- Обратите внимание: Service Role Key бэкенда обходит RLS, что нам и нужно для работы слоя абстракции (DAL).

-- Разрешаем чтение ТОЛЬКО аутентифицированным пользователям с совпадающим ID (если это их собственный профиль)
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING ( auth.uid() = id );

-- Обновление только своих данных
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING ( auth.uid() = id );

-- ВАЖНО: Никаких политик на public.deceased_profiles для "anon" (анонимных) пользователей.
-- Доступ к PIn-защищенным профилям идет СТРОГО через Backend Middleware.
