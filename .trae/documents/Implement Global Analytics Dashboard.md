I will add a **Global Analytics** section to the dashboard to show the aggregated statistics across all of the user's widgets.

### **Plan:**

1.  **Backend Updates (`supabase_schema.sql`):**
    *   Create a new RPC function `get_global_dashboard_stats(owner_wallet_addr text)` that aggregates data from **all projects owned by that wallet**.
    *   It will sum up:
        *   `total_visits` across all projects.
        *   `daily_visits` across all projects.
        *   `connected_wallets` (Total distinct users across all projects).
        *   `tasks_completed` (Total tasks + viral boosts + daily claims across all projects).
        *   `total_projects` (Count of projects owned).

2.  **Frontend Integration (`lib/supabase.ts`):**
    *   Add `fetchGlobalStats(ownerAddress)` to call the new RPC.

3.  **UI Updates (`Dashboard.tsx`):**
    *   Add a new **"Overview"** card/section at the top of the Dashboard.
    *   Display the aggregated metrics in a prominent, clean layout using the existing design language (slate/indigo theme).
    *   Show metrics like:
        *   Total Views (All Time)
        *   Active Widgets (Projects Count)
        *   Total Users (Unique wallets across ecosystem)
        *   Total Actions (Tasks Completed)

### **Verification:**
*   I will verify that the global stats match the sum of the individual project cards.
*   I will ensure the layout is responsive and fits nicely above the grid of cards.