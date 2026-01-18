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
  order_index integer default 0,
  is_sponsored boolean default false
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

-- SECURITY: Revoke access to sensitive api_key column
REVOKE SELECT (api_key) ON projects FROM anon, authenticated;

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
set search_path = public
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
set search_path = public
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

  -- Tasks Completed (Regular Tasks + Viral Boosts + Daily Claims)
  select 
    (select count(tc.id) 
     from task_completions tc
     join tasks t on tc.task_id = t.id
     where t.project_id = p_id)
    +
    (select count(vbc.id)
     from viral_boost_completions vbc
     where vbc.project_id = p_id)
    +
    (select count(dcl.id)
     from daily_claim_logs dcl
     where dcl.project_id = p_id)
  into tasks_completed;

  -- Active Users Weekly (Unique users who completed a task OR viral boost OR daily claim in last 7 days)
  with active_users as (
    select tc.user_id
    from task_completions tc
    join tasks t on tc.task_id = t.id
    where t.project_id = p_id
      and tc.created_at >= (now() - interval '7 days')
    union
    select vbc.user_id
    from viral_boost_completions vbc
    where vbc.project_id = p_id
      and vbc.created_at >= (now() - interval '7 days')
    union
    select dcl.user_id
    from daily_claim_logs dcl
    where dcl.project_id = p_id
      and dcl.created_at >= (now() - interval '7 days')
  )
  select count(distinct user_id) into auw from active_users;

  return json_build_object(
    'total_visits', total_visits,
    'daily_visits', daily_visits,
    'connected_wallets', connected_wallets,
    'tasks_completed', tasks_completed,
    'auw', auw
  );
end;
$$;

-- Get Global Stats (All Projects for an Owner)
create or replace function get_global_dashboard_stats(owner_addr text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  total_projects bigint;
  total_visits bigint;
  daily_visits bigint;
  total_users bigint;
  total_actions bigint;
begin
  -- Total Projects
  select count(*) into total_projects 
  from projects 
  where owner_wallet = owner_addr;

  -- Total Visits (Across all owned projects)
  select count(*) into total_visits 
  from analytics_events ae
  join projects p on ae.project_id = p.id
  where p.owner_wallet = owner_addr 
    and ae.event_type = 'view';

  -- Daily Visits (Across all owned projects)
  select count(*) into daily_visits 
  from analytics_events ae
  join projects p on ae.project_id = p.id
  where p.owner_wallet = owner_addr 
    and ae.event_type = 'view'
    and ae.created_at >= current_date;

  -- Total Unique Users (Across all owned projects)
  -- Note: A user connecting to 2 different projects counts as 2 "users" in this context usually, 
  -- but "distinct wallet_address" would mean unique people.
  -- Let's count distinct wallet addresses across the ecosystem.
  select count(distinct eu.wallet_address) into total_users
  from end_users eu
  join projects p on eu.project_id = p.id
  where p.owner_wallet = owner_addr;

  -- Total Actions (Tasks + Viral + Claims)
  select 
    (select count(tc.id) 
     from task_completions tc
     join tasks t on tc.task_id = t.id
     join projects p on t.project_id = p.id
     where p.owner_wallet = owner_addr)
    +
    (select count(vbc.id)
     from viral_boost_completions vbc
     join projects p on vbc.project_id = p.id
     where p.owner_wallet = owner_addr)
    +
    (select count(dcl.id)
     from daily_claim_logs dcl
     join projects p on dcl.project_id = p.id
     where p.owner_wallet = owner_addr)
  into total_actions;

  return json_build_object(
    'total_projects', total_projects,
    'total_visits', total_visits,
    'daily_visits', daily_visits,
    'total_users', total_users,
    'total_actions', total_actions
  );
end;
$$;

-- 8. Global Stats Helper
-- Returns the total XP for a given wallet address across all projects
create or replace function get_global_xp(wallet_addr text)
returns bigint
language sql
security definer
set search_path = public
as $$
  select coalesce(sum(up.xp), 0)
  from user_progress up
  join end_users eu on up.user_id = eu.id
  where eu.wallet_address = wallet_addr;
$$;

-- 9. Viral Boost Completions (Social Shares)
create table if not exists viral_boost_completions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references end_users(id) on delete cascade not null,
  project_id uuid references projects(id) on delete cascade not null,
  platform text not null -- 'x', 'tg', 'wa', 'fb', 'li'
);

-- One viral boost per platform per day (UTC) per user/project
create unique index if not exists viral_boost_completions_daily_unique
  on viral_boost_completions (
    user_id,
    project_id,
    platform,
    ((created_at at time zone 'utc')::date)
  );

-- Enable RLS for Viral Boosts
alter table viral_boost_completions enable row level security;
create policy "Users can read own viral boosts" on viral_boost_completions for select using (true);
create policy "Users can insert own viral boosts" on viral_boost_completions for insert with check (true);

-- Grant Execute Permissions for RPCs
GRANT EXECUTE ON FUNCTION log_project_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_project_stats(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_global_dashboard_stats(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_daily_bonus(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_global_xp(text) TO anon, authenticated;

-- 11. Daily Claim Logs (For Analytics)
create table if not exists daily_claim_logs (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references end_users(id) on delete cascade not null,
  project_id uuid references projects(id) on delete cascade not null,
  streak_at_claim integer,
  xp_amount integer
);

-- RLS
alter table daily_claim_logs enable row level security;
create policy "Users can read own claim logs" on daily_claim_logs for select using (true);
create policy "Users can insert own claim logs" on daily_claim_logs for insert with check (true);

-- 10. Daily Claim Logic (Streak System)
create or replace function claim_daily_bonus(u_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  current_xp int;
  current_streak int;
  last_claim timestamptz;
  new_streak int;
  bonus_amount int;
  now_utc timestamptz := now();
  days_diff int;
begin
  -- Get current state
  select xp, streak, last_claim_date 
  into current_xp, current_streak, last_claim 
  from user_progress 
  where user_id = u_id;

  -- Handle first time claim
  if current_streak is null then
    current_streak := 0;
  end if;

  if last_claim is null then
    days_diff := 999; -- Treat as "long time ago"
  else
    -- Calculate difference in days between Now and Last Claim (UTC)
    -- We cast to date to ignore time parts (midnight to midnight)
    days_diff := (date(now_utc) - date(last_claim));
  end if;

  -- Check if already claimed today
  if days_diff = 0 then
    return json_build_object('success', false, 'message', 'Already claimed today');
  end if;

  -- Calculate New Streak
  if days_diff = 1 then
    -- Consecutive day: Increment streak
    new_streak := current_streak + 1;
    if new_streak > 5 then new_streak := 1; end if; -- Reset after 5 days cycle? Or cap at 5? Requirement says "cycle for 5 days" usually means 1->5 then reset or stay at 5. Let's assume reset cycle 1-5.
    -- Actually, usually streak resets to 1 after 5 if it's a 5-day cycle reward. 
    -- Let's stick to: 1,2,3,4,5 -> 1.
  else
    -- Missed a day (or first time): Reset to 1
    new_streak := 1;
  end if;

  -- Calculate Bonus
  -- Day 1: 100
  -- Day 2: 200
  -- Day 3: 400
  -- Day 4: 800
  -- Day 5: 1600
  bonus_amount := 100 * power(2, new_streak - 1);

  -- Update DB
  update user_progress 
  set 
    xp = current_xp + bonus_amount,
    streak = new_streak,
    last_claim_date = now_utc
  where user_id = u_id;

  -- Log Claim for Analytics
  insert into daily_claim_logs (user_id, project_id, streak_at_claim, xp_amount)
  select u_id, project_id, new_streak, bonus_amount
  from end_users
  where id = u_id;

  return json_build_object(
    'success', true,
    'new_streak', new_streak,
    'bonus', bonus_amount,
    'new_total_xp', current_xp + bonus_amount
  );
end;
$$;
