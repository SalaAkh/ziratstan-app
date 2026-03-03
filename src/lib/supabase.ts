import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ ОШИБКА: Не заданы переменные окружения Supabase. Проект будет работать с мок-данными, пока вы не укажете ключи в .env.local');
}

// Создаем единый клиент (Singleton) для использования на клиенте и сервере
export const supabase = createClient(
    supabaseUrl || 'http://localhost:54321', // Fallback URL чтобы не падал билд
    supabaseAnonKey || 'dummy_key_to_prevent_crash'
);
