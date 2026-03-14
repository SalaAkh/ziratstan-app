-- Move PostGIS extension to 'extensions' schema to resolve Supabase Security warnings
-- regarding missing RLS on public.spatial_ref_sys

CREATE SCHEMA IF NOT EXISTS "extensions";

-- Supabase best practices recommend keeping extensions in their own schema
-- instead of 'public' to avoid exposing internal tables like spatial_ref_sys
-- to the PostgREST API and to clear Security Advisor warnings.
ALTER EXTENSION postgis SET SCHEMA "extensions";
ALTER EXTENSION "uuid-ossp" SET SCHEMA "extensions";
