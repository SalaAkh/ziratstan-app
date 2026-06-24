-- =============================================================================
-- Ziratstan.kz — Исправление: rls_disabled_in_public
-- Дата: 2026-06-25
-- 
-- Стратегия:
-- Динамически включаем Row Level Security (RLS) для ВСЕХ таблиц в схеме public.
-- Это гарантирует, что ни одна забытая таблица (например, deceased_profiles) 
-- не останется доступной для всех (предупреждение "Стол доступен для всеобщего обозрения").
-- =============================================================================

BEGIN;

DO $$
DECLARE
    t record;
BEGIN
    FOR t IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.tablename);
    END LOOP;
END $$;

COMMIT;
