-- -------------------------------------------------------------------------
-- RESET & DEBUG POLICIES
-- Run this script in your Supabase SQL Editor to fix 401/403 Permission Errors
-- -------------------------------------------------------------------------

-- 1. Drop existing policies to avoid conflicts
drop policy if exists "Public read access for projects" on projects;
drop policy if exists "Public insert access for projects" on projects;
drop policy if exists "Public update access for projects" on projects;

drop policy if exists "Public read access for tasks" on tasks;
drop policy if exists "Public insert access for tasks" on tasks;
drop policy if exists "Public update access for tasks" on tasks;

drop policy if exists "Users can read own data" on end_users;
drop policy if exists "Users can insert own data" on end_users;

drop policy if exists "Users can read own progress" on user_progress;
drop policy if exists "Users can insert own progress" on user_progress;
drop policy if exists "Users can update own progress" on user_progress;

drop policy if exists "Users can read own completions" on task_completions;
drop policy if exists "Users can insert own completions" on task_completions;

-- 2. Force Enable RLS (just in case)
alter table projects enable row level security;
alter table tasks enable row level security;
alter table end_users enable row level security;
alter table user_progress enable row level security;
alter table task_completions enable row level security;

-- 3. Re-create Permissive Policies (Builder Mode Friendly)

-- Projects: Allow anyone to read/create/update (needed for the builder to save config)
create policy "Enable all access for projects" on projects for all using (true) with check (true);

-- Tasks: Allow anyone to read/create/update
create policy "Enable all access for tasks" on tasks for all using (true) with check (true);

-- End Users: Allow anyone to read/create (needed for wallet connection)
create policy "Enable all access for end_users" on end_users for all using (true) with check (true);

-- User Progress: Allow anyone to read/create/update
create policy "Enable all access for user_progress" on user_progress for all using (true) with check (true);

-- Task Completions: Allow anyone to read/create
create policy "Enable all access for task_completions" on task_completions for all using (true) with check (true);

-- 4. Grant permissions to anon role (Fixes 401 errors if grants were missing)
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
