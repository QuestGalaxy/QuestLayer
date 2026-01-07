I will implement daily claim logging to ensure "Daily Tasks" (claims) are also counted in the analytics.

### **Plan:**

1.  **Create `daily_claim_logs` Table:**
    *   Columns: `id`, `user_id`, `project_id` (derived via trigger or stored directly? Storing directly is easier for stats), `created_at`, `streak_at_claim`, `xp_amount`.
    *   However, `user_progress` does not store `project_id` directly, but `user_id` -> `end_users` -> `project_id` does.
    *   To keep it simple for the RPC, I will fetch `project_id` from `end_users` inside the RPC and insert it into the log.

2.  **Update `claim_daily_bonus` RPC:**
    *   Fetch `project_id` from `end_users`.
    *   Insert a record into `daily_claim_logs` whenever a claim is successful.

3.  **Update `get_project_stats` RPC:**
    *   Add `(select count(id) from daily_claim_logs where project_id = p_id)` to the `tasks_completed` sum.
    *   Add `daily_claim_logs` to the `active_users` union for AUW calculation.

### **Verification:**
*   I will verify the SQL syntax.
*   The "Completed" stat will then reflect `Regular Tasks + Viral Boosts + Daily Claims`.

**Note:** I will use `end_users` to look up the `project_id` inside `claim_daily_bonus`.

```sql
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
```