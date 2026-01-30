
-- 13. Leaderboard Reward Claims
create table if not exists leaderboard_reward_claims (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references end_users(id) on delete cascade not null,
  project_id uuid references projects(id) on delete cascade not null,
  period_type text not null, -- 'daily' or 'weekly'
  period_identifier text not null, -- 'YYYY-MM-DD' or 'YYYY-Wxx'
  rank integer not null,
  reward_amount integer not null,
  unique(user_id, project_id, period_type, period_identifier)
);

-- Enable RLS
alter table leaderboard_reward_claims enable row level security;
create policy "Users can read own leaderboard claims" on leaderboard_reward_claims for select using (true);
create policy "Users can insert own leaderboard claims" on leaderboard_reward_claims for insert with check (true);

-- Widget size (trigger button size)
alter table projects add column if not exists widget_size text default 'medium';

-- 14. Claim Leaderboard Reward RPC
create or replace function claim_leaderboard_reward(
  p_user_id uuid,
  p_project_id uuid,
  p_period_type text -- 'daily' or 'weekly'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rank integer;
  v_reward_amount integer;
  v_period_identifier text;
  v_already_claimed boolean;
  v_wallet text;
begin
  -- 1. Determine Period Identifier
  if p_period_type = 'daily' then
    v_period_identifier := to_char(now() at time zone 'utc', 'YYYY-MM-DD');
  elsif p_period_type = 'weekly' then
    v_period_identifier := to_char(now() at time zone 'utc', 'IYYY-IW');
  else
    return json_build_object('success', false, 'message', 'Invalid period type');
  end if;

  -- 2. Check if already claimed
  if exists (
    select 1 from leaderboard_reward_claims
    where user_id = p_user_id
      and project_id = p_project_id
      and period_type = p_period_type
      and period_identifier = v_period_identifier
  ) then
    return json_build_object('success', false, 'message', 'Already claimed for this period');
  end if;

  -- 3. Calculate Rank
  -- Note: This is computationally expensive for real-time, but acceptable for MVP.
  -- Ideally, rank snapshots should be stored periodically.
  if p_period_type = 'daily' then
    -- Daily Rank Logic (Simplified: Based on XP gained today)
    -- For MVP, let's use the 'get_project_leaderboard_weekly' logic but restricted to today?
    -- OR, let's stick to the user's request: "Leaderboard'da ilk 10".
    -- Usually leaderboard is "All Time" or "Weekly". Let's assume they mean "Weekly Leaderboard" for Weekly Reward
    -- and maybe "Daily Activity" for Daily Reward?
    -- Let's use the 'get_project_leaderboard_weekly' function for WEEKLY.
    -- For DAILY, we need a daily equivalent or just use All-Time rank?
    -- User said "Daily and Weekly buttons". Let's assume Daily Reward is based on Yesterday's rank or Real-time rank?
    -- Let's use Real-time All-Time Rank for Daily, and Weekly Rank for Weekly.
    
    -- Actually, to keep it simple and consistent with "Leaderboard":
    -- Weekly Reward -> Uses Weekly Leaderboard Rank
    -- Daily Reward -> Uses All-Time Leaderboard Rank (as a simple mechanic) OR Daily XP Rank.
    -- Let's go with:
    -- Daily: Rank based on All-Time XP (High competition)
    -- Weekly: Rank based on Weekly XP (Fresh start every week)
    
     with all_time_ranks as (
      select 
        id as uid,
        rank() over (order by (select xp from user_progress where user_id = end_users.id) desc) as rnk
      from end_users
      where project_id = p_project_id
    )
    select rnk into v_rank from all_time_ranks where uid = p_user_id;
    
  else -- weekly
    -- Use the existing logic from get_project_leaderboard_weekly but for a specific user
    -- We need to extract the logic to get a single user's rank efficiently or run the query.
    -- Re-using the query logic:
    with weekly_stats as (
        select tc.user_id, sum(t.xp_reward) as earned_xp
        from task_completions tc
        join tasks t on tc.task_id = t.id
        where t.project_id = p_project_id and tc.created_at >= (now() - interval '7 days')
        group by tc.user_id
        union all
        select dcl.user_id, sum(dcl.xp_amount) as earned_xp
        from daily_claim_logs dcl
        where dcl.project_id = p_project_id and dcl.created_at >= (now() - interval '7 days')
        group by dcl.user_id
    ),
    aggregated as (
        select user_id, sum(earned_xp) as total_xp from weekly_stats group by user_id
    ),
    ranked as (
        select user_id, rank() over (order by total_xp desc) as rnk from aggregated
    )
    select rnk into v_rank from ranked where user_id = p_user_id;
  end if;

  -- 4. Check Eligibility (Top 10)
  if v_rank is null or v_rank > 10 then
    return json_build_object('success', false, 'message', 'Not in Top 10');
  end if;

  -- 5. Determine Reward Amount
  -- Simple tiered reward
  if v_rank = 1 then v_reward_amount := 1000;
  elsif v_rank = 2 then v_reward_amount := 500;
  elsif v_rank = 3 then v_reward_amount := 250;
  else v_reward_amount := 100; -- 4-10
  end if;

  -- Multiplier for Weekly (e.g. 5x Daily)
  if p_period_type = 'weekly' then
    v_reward_amount := v_reward_amount * 5;
  end if;

  -- 6. Grant Reward
  update user_progress
  set xp = xp + v_reward_amount
  where user_id = p_user_id;

  -- 7. Log Claim
  insert into leaderboard_reward_claims (user_id, project_id, period_type, period_identifier, rank, reward_amount)
  values (p_user_id, p_project_id, p_period_type, v_period_identifier, v_rank, v_reward_amount);

  return json_build_object(
    'success', true, 
    'rank', v_rank, 
    'reward', v_reward_amount,
    'message', 'Reward claimed successfully!'
  );
end;
$$;

-- 15. Check Claim Status
create or replace function get_leaderboard_claim_status(
  p_user_id uuid,
  p_project_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_daily_id text := to_char(now() at time zone 'utc', 'YYYY-MM-DD');
  v_weekly_id text := to_char(now() at time zone 'utc', 'IYYY-IW');
  v_daily_claimed boolean;
  v_weekly_claimed boolean;
begin
  select exists(
    select 1 from leaderboard_reward_claims
    where user_id = p_user_id and project_id = p_project_id and period_type = 'daily' and period_identifier = v_daily_id
  ) into v_daily_claimed;

  select exists(
    select 1 from leaderboard_reward_claims
    where user_id = p_user_id and project_id = p_project_id and period_type = 'weekly' and period_identifier = v_weekly_id
  ) into v_weekly_claimed;

  return json_build_object(
    'daily_claimed', v_daily_claimed,
    'weekly_claimed', v_weekly_claimed
  );
end;
$$;

GRANT EXECUTE ON FUNCTION claim_leaderboard_reward(uuid, uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_claim_status(uuid, uuid) TO anon, authenticated;
