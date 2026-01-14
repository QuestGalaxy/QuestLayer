-- -------------------------------------------------------------------------
-- SECURITY FIXES
-- Fixes issues reported in "Supabase Performance Security Lints":
-- 1. "Policy Exists RLS Disabled" & "RLS Disabled in Public"
-- 2. "Sensitive Columns Exposed" (api_key in projects table)
-- -------------------------------------------------------------------------

-- 1. Force Enable Row Level Security (RLS) on all tables
-- This ensures that the defined policies are actually enforced.
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.end_users enable row level security;
alter table public.user_progress enable row level security;
alter table public.task_completions enable row level security;
alter table public.analytics_events enable row level security;
alter table public.viral_boost_completions enable row level security;
alter table public.daily_claim_logs enable row level security;

-- 2. Restrict access to sensitive 'api_key' column
-- Revoke SELECT permission on the api_key column for public roles (anon and authenticated).
-- This prevents 'SELECT *' from exposing the API key and requires explicit column selection in queries.
REVOKE SELECT (api_key) ON public.projects FROM anon, authenticated;

-- Note: The frontend code has been updated to select specific columns and exclude 'api_key'.

-- 3. Fix "Function Search Path Mutable" Warnings
-- Sets a fixed search_path for SECURITY DEFINER functions to prevent search_path hijacking.
ALTER FUNCTION public.log_project_view(uuid) SET search_path = public;
ALTER FUNCTION public.get_project_stats(uuid) SET search_path = public;
ALTER FUNCTION public.get_global_dashboard_stats(text) SET search_path = public;
ALTER FUNCTION public.get_global_xp(text) SET search_path = public;
ALTER FUNCTION public.claim_daily_bonus(uuid) SET search_path = public;
