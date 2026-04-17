-- ==============================================================================
-- Представления для безопасного экспорта данных (Compliance, ЗРК "О ПД")
-- Маскирование PII (адреса email, телефоны) для BI-аналитики и аудиторов
-- ==============================================================================

-- 1. Представление для сессий администратора (скрываем точные Email)
CREATE OR REPLACE VIEW admin_sessions_masked AS
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

-- Предоставляем права на чтение VIEW администраторам и аналитикам
GRANT SELECT ON admin_sessions_masked TO authenticated;

-- 2. Представление для заказов/лидов (скрываем Полный Телефон)
CREATE OR REPLACE VIEW services_leads_masked AS
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
    status
FROM 
    services_leads;

-- Предоставляем права на чтение VIEW
GRANT SELECT ON services_leads_masked TO authenticated;

-- Комментарии к представлениям
COMMENT ON VIEW admin_sessions_masked IS 'Безопасное представление сессий. Email скрыт в рамках комплаенса РК.';
COMMENT ON VIEW services_leads_masked IS 'Безопасное представление лидов. Телефон скрыт в рамках комплаенса РК.';
