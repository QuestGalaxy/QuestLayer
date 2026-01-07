-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Projects (Widget Configuration)
create table if not exists projects (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  owner_id uuid references auth.users(id), -- Links to the admin user
  owner_wallet text, -- Store wallet address of the creator
  domain text, -- The website where this widget will be embedded
  accent_color text default '#6366f1',
  position text default 'bottom-right',
  theme text default 'sleek',
  api_key uuid default uuid_generate_v4() unique -- Used by the widget to load config
);

-- 2. Tasks (Quests)
create table if not exists tasks (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  project_id uuid references projects(id) on delete cascade not null,
  title text not null,
  description text,
  link text,
  icon_url text,
  xp_reward integer default 100,
  order_index integer default 0
);

-- 3. End Users (People using the widget)
create table if not exists end_users (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  project_id uuid references projects(id) on delete cascade not null,
  wallet_address text not null,
  unique(project_id, wallet_address)
);

-- 4. User Progress (XP & Streak)
create table if not exists user_progress (
  id uuid default uuid_generate_v4() primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references end_users(id) on delete cascade not null,
  xp integer default 0,
  streak integer default 0,
  last_claim_date timestamp with time zone,
  unique(user_id)
);

-- 5. Task Completions (Prevent duplicate rewards)
create table if not exists task_completions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references end_users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  unique(user_id, task_id)
);

-- Enable Row Level Security (RLS)
alter table projects enable row level security;
alter table tasks enable row level security;
alter table end_users enable row level security;
alter table user_progress enable row level security;
alter table task_completions enable row level security;

-- Policies (UPDATED: Allow Insert/Update for Builder Mode)
-- Note: In a real production app, you would restrict Project/Task creation to authenticated admins only.
-- For this builder/demo, we allow public creation so the frontend can generate the config.

-- Projects
create policy "Public read access for projects" on projects for select using (true);
create policy "Public insert access for projects" on projects for insert with check (true);
create policy "Public update access for projects" on projects for update using (true);

-- Tasks
create policy "Public read access for tasks" on tasks for select using (true);
create policy "Public insert access for tasks" on tasks for insert with check (true);
create policy "Public update access for tasks" on tasks for update using (true);

-- End Users
create policy "Users can read own data" on end_users for select using (true);
create policy "Users can insert own data" on end_users for insert with check (true);

-- User Progress
create policy "Users can read own progress" on user_progress for select using (true);
create policy "Users can insert own progress" on user_progress for insert with check (true);
create policy "Users can update own progress" on user_progress for update using (true);

-- Task Completions
create policy "Users can read own completions" on task_completions for select using (true);
create policy "Users can insert own completions" on task_completions for insert with check (true);

-- 6. Analytics Events (Views/Loads)
create table if not exists analytics_events (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  project_id uuid references projects(id) on delete cascade not null,
  event_type text not null default 'view' -- 'view', 'interact', etc.
);

-- Add last_ping_at to projects for Online status
alter table projects add column if not exists last_ping_at timestamp with time zone;

-- Enable RLS for Analytics
alter table analytics_events enable row level security;
create policy "Public insert access for analytics" on analytics_events for insert with check (true);
create policy "Public read access for analytics" on analytics_events for select using (true);

-- 7. Analytics RPCs

-- Log a view and update the project's last_ping_at timestamp (Heartbeat)
create or replace function log_project_view(p_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Insert view record
  insert into analytics_events (project_id, event_type)
  values (p_id, 'view');

  -- Update project heartbeat
  update projects 
  set last_ping_at = now() 
  where id = p_id;
end;
$$;

-- Get Dashboard Stats for a Project
create or replace function get_project_stats(p_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  total_visits bigint;
  daily_visits bigint;
  connected_wallets bigint;
  tasks_completed bigint;
  auw bigint; -- Active Users Weekly (Unique users who completed a task in last 7 days)
begin
  -- Total Visits
  select count(*) into total_visits 
  from analytics_events 
  where project_id = p_id and event_type = 'view';

  -- Daily Visits (UTC)
  select count(*) into daily_visits 
  from analytics_events 
  where project_id = p_id 
    and event_type = 'view' 
    and created_at >= current_date;

  -- Connected Wallets
  select count(*) into connected_wallets 
  from end_users 
  where project_id = p_id;

  -- Tasks Completed
  select count(tc.id) into tasks_completed
  from task_completions tc
  join tasks t on tc.task_id = t.id
  where t.project_id = p_id;

  -- Active Users Weekly (Unique users who completed a task in last 7 days)
  select count(distinct tc.user_id) into auw
  from task_completions tc
  join tasks t on tc.task_id = t.id
  where t.project_id = p_id
    and tc.created_at >= (now() - interval '7 days');

  return json_build_object(
    'total_visits', total_visits,
    'daily_visits', daily_visits,
    'connected_wallets', connected_wallets,
    'tasks_completed', tasks_completed,
    'auw', auw
  );
end;
$$;

-- 8. Global Stats Helper
-- Returns the total XP for a given wallet address across all projects
create or replace function get_global_xp(wallet_addr text)
returns bigint
language sql
security definer
as $$
  select coalesce(sum(up.xp), 0)
  from user_progress up
  join end_users eu on up.user_id = eu.id
  where eu.wallet_address = wallet_addr;
$$;
