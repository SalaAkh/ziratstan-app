-- Grant table-level permissions to anon and authenticated roles
-- (RLS policies will restrict actual access)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ugc_submissions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ugc_profile_submissions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ugc_bio_submissions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.services_leads TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
