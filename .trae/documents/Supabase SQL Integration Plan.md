Based on the codebase analysis, here is the plan to integrate Supabase with a robust SQL schema. The schema separates the **Project Configuration** (managed by you/admins) from the **User Data** (managed by the widget users).

### 1. Database Schema (Supabase/PostgreSQL)

We will create the following tables to store your app data:

*   **`projects`**: Stores the widget configuration (Name, Theme, Accent Color, Position).
*   **`tasks`**: Stores the quests associated with each project.
*   **`end_users`**: Stores the users (identified by Wallet Address) for each project.
*   **`user_progress`**: Tracks XP, Streak, and Daily Claims for each user.
*   **`task_completions`**: Tracks which tasks a user has completed to prevent double rewards.

#### SQL Definition
```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Projects (Widget Configuration)
create table projects (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  owner_id uuid references auth.users(id), -- Links to the admin user
  accent_color text default '#6366f1',
  position text default 'bottom-right',
  theme text default 'sleek',
  api_key uuid default uuid_generate_v4() unique -- Used by the widget to load config
);

-- 2. Tasks (Quests)
create table tasks (
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
create table end_users (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  project_id uuid references projects(id) on delete cascade not null,
  wallet_address text not null,
  unique(project_id, wallet_address)
);

-- 4. User Progress (XP & Streak)
create table user_progress (
  id uuid default uuid_generate_v4() primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references end_users(id) on delete cascade not null,
  xp integer default 0,
  streak integer default 0,
  last_claim_date timestamp with time zone,
  unique(user_id)
);

-- 5. Task Completions (Prevent duplicate rewards)
create table task_completions (
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

-- Policies (Simplified for initial dev, refine for production)
create policy "Public read access for projects" on projects for select using (true);
create policy "Public read access for tasks" on tasks for select using (true);
create policy "Users can read own data" on end_users for select using (true); -- simplified
create policy "Users can insert own data" on end_users for insert with check (true); -- simplified
```

### 2. Integration Steps

1.  **Environment Setup**:
    *   Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`.
    *   Install `@supabase/supabase-js`.

2.  **Code Implementation**:
    *   Create `lib/supabase.ts` for client initialization.
    *   Update `App.tsx` / `Editor.tsx` to save the project configuration to the `projects` and `tasks` tables.
    *   Update `Widget.tsx` to:
        *   Fetch configuration from Supabase instead of using hardcoded `INITIAL_TASKS`.
        *   Sync `userXP`, `streak`, and completions to `user_progress` and `task_completions` tables instead of just `localStorage`.

### 3. Immediate Next Step
Once you approve this plan, I will:
1.  Create a `supabase_schema.sql` file with the SQL above so you can run it in your Supabase SQL Editor.
2.  Install the Supabase client.
3.  Set up the `lib/supabase.ts` file.
