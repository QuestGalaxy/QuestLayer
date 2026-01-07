I will verify and update the analytics aggregation logic to ensure it correctly counts all user activities: **Regular Tasks**, **Viral Boosts** (Social Shares), and **Daily Claims**.

### **Problem:**
The current `get_project_stats` RPC function (which I previously wrote) might only be counting **regular task completions** in the "Tasks Completed" metric. It needs to also include **viral boost completions** and potentially **daily claims** if those are considered "tasks" in your analytics model.

### **Plan:**

1.  **Review & Update Database RPC (`supabase_schema.sql`):**
    *   **Modify `get_project_stats` function:**
        *   Update the `tasks_completed` count to be the sum of:
            *   Rows in `task_completions` (Regular Tasks)
            *   Rows in `viral_boost_completions` (Social Shares)
            *   *(Optional)* Daily claims are usually tracked as "retention" rather than "tasks", but if you want them counted, we can add `user_progress.streak` data, though it's harder to count "total claims" historically without a `daily_claims_log` table. For now, I will ensure **Viral Boosts** are definitely added to the count.
    *   **Ensure `auw` (Active Users Weekly) logic** also considers users who did a viral boost, not just a regular task.

2.  **No Frontend Changes Required:**
    *   The `Dashboard.tsx` already displays whatever `get_project_stats` returns.
    *   The `Widget.tsx` correctly inserts into `viral_boost_completions`.

### **Verification:**
*   I will update the SQL function.
*   The "Completed" stat on the dashboard card will then reflect `Regular Tasks + Viral Boosts`.

### **Refined `get_project_stats` Logic:**
```sql
  -- Tasks Completed = Regular Tasks + Viral Boosts
  select 
    (select count(*) from task_completions tc 
     join tasks t on tc.task_id = t.id 
     where t.project_id = p_id) 
    +
    (select count(*) from viral_boost_completions vbc 
     where vbc.project_id = p_id)
  into tasks_completed;
```