-- Этот скрипт нужно запустить в SQL Editor внутри панели управления Supabase
ALTER TABLE qr_codes
ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 0;