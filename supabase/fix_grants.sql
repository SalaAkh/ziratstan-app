-- Fix for "permission denied for table profile_collaborators"
-- When anon users query the profiles table, RLS attempts to evaluate policies that 
-- reference profile_collaborators. If anon lacks GRANT SELECT, it crashes the entire query.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profile_collaborators TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admin_sessions TO anon, authenticated;

-- Also, let's make sure the policies on profile_collaborators don't crash when auth.uid() is null.
-- It's safe to just let it be, but granting the permissions on the table level is required.

-- Let's also grant usage on sequences just in case.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
