-- Ziratstan (Зиратстан) Database Schema (Supabase)
-- Бисмиллях! Эта схема создает фундамент для хранения профилей, локаций и медиа.
-- Включаем PostGIS (для геолокации могил)
CREATE SCHEMA IF NOT EXISTS "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA "extensions";
-- 1. Таблица Кладбищ (Cemeteries)
CREATE TABLE IF NOT EXISTS cemeteries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  -- Название кладбища (например, Кенсай-2)
  city VARCHAR(100) NOT NULL,
  -- Город (Алматы)
  region VARCHAR(100),
  -- Регион (Алматинская область)
  -- Полигон границ кладбища (опционально для старта, но нужно для будущего)
  boundary GEOMETRY(Polygon, 4326),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2. Таблица Профилей / Мемориалов (Profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  patronymic VARCHAR(100),
  -- Отчество (если есть)
  birth_date DATE,
  death_date DATE,
  epitaph TEXT,
  -- Эпитафия (надпись на памятнике)
  biography TEXT,
  -- Полная биография
  -- Внешние ключи
  cemetery_id UUID REFERENCES cemeteries(id) ON DELETE
  SET NULL,
    -- Точные координаты могилы (Point)
    location GEOMETRY(Point, 4326),
    -- Медиа (Главное фото)
    main_photo_url TEXT,
    -- Статус профиля (public - видят все при скане, private - только по пин-коду)
    visibility_status VARCHAR(20) DEFAULT 'public' CHECK (visibility_status IN ('public', 'family_only', 'private')),
    pin_code VARCHAR(4),
    -- Для приватных профилей
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Индекс для быстрого поиска по локации (Spatial Index)
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_profiles_owner_id ON profiles(owner_id);
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 3. Таблица QR-кодов (QR Codes)
-- Связывает физическую наклейку/табличку с цифровым профилем
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  -- Короткий уникальный код (например: ZRT-1234)
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  scan_count INTEGER DEFAULT 0,
  -- Счётчик сканирований для аналитики
  activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Индекс по slug для быстрого редиректа при сканировании
CREATE INDEX IF NOT EXISTS idx_qr_codes_slug ON qr_codes(slug);
-- 4. Таблица Медиа галереи (Media Gallery)
-- Фото, видео, аудио, связанные с профилем
CREATE TABLE IF NOT EXISTS media_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL CHECK (
    media_type IN ('image', 'video', 'audio', 'document')
  ),
  file_url TEXT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 5. Таблица Услуг по уходу (Cemetery Services) - Монетизация
CREATE TABLE IF NOT EXISTS services_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  service_type VARCHAR(50) NOT NULL,
  -- 'cleaning', 'painting', 'quran_reading'
  status VARCHAR(50) DEFAULT 'pending' CHECK (
    status IN (
      'pending',
      'in_progress',
      'completed',
      'cancelled'
    )
  ),
  price DECIMAL(10, 2) NOT NULL,
  -- Отчеты исполнителя (сохраняются после выполнения)
  report_photo_before_url TEXT,
  report_photo_after_url TEXT,
  report_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
-- 6. Таблица Родственных связей (Family Tree Relations)
CREATE TABLE IF NOT EXISTS profile_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- relation_type описывает, кем profile_2 приходится profile_1.
  -- Возможные значения: 'parent', 'child', 'spouse', 'sibling'
  relation_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chk_relation_type CHECK (
    relation_type IN ('parent', 'child', 'spouse', 'sibling')
  )
);
-- Индексы для быстрого поиска связей в обе стороны
CREATE INDEX IF NOT EXISTS idx_relations_p1 ON profile_relations(profile_id_1);
CREATE INDEX IF NOT EXISTS idx_relations_p2 ON profile_relations(profile_id_2);
-- 7. UGC: Предложения пользователей о названиях кладбищ
CREATE TABLE IF NOT EXISTS ugc_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cemetery_id VARCHAR(255),
  current_name VARCHAR(255),
  suggested_name VARCHAR(255) NOT NULL,
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),
  comment TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 8. Лиды заявок на услуги (Монетизация)
CREATE TABLE IF NOT EXISTS services_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_type VARCHAR(50) NOT NULL,
  -- 'cleaning', 'painting', 'quran_reading'
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  profile_ref VARCHAR(255),
  -- ID или ссылка на профиль усопшего
  comment TEXT,
  price DECIMAL(10, 2),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 9. UGC: Предложения пользователей по добавлению новых личностей
CREATE TABLE IF NOT EXISTS ugc_profile_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cemetery_id VARCHAR(255),
  cemetery_name VARCHAR(255),
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),
  full_name VARCHAR(255) NOT NULL,
  birth_year VARCHAR(50),
  death_year VARCHAR(50),
  description TEXT,
  published_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 10. UGC: Предложения пользователей по дополнению биографий
CREATE TABLE IF NOT EXISTS ugc_bio_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(255),
  bio_text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
