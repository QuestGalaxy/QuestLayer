I will implement comprehensive analytics and status tracking for your widgets.

### **Plan:**

1.  **Database Updates (`supabase_schema.sql`):**
    *   **New Table:** `analytics_events` to track widget loads ('views').
    *   **New Column:** `last_ping_at` on the `projects` table to track online status.
    *   **New RPC Function:** `log_project_view(project_id)` to securely record a visit and update the "last ping" timestamp simultaneously.
    *   **New RPC Function:** `get_dashboard_stats(project_id)` to efficiently calculate:
        *   **Daily Visits:** Views recorded today.
        *   **Total Visits:** All-time views.
        *   **Connected Wallets:** Total unique users who have connected.
        *   **Tasks Completed:** Total number of missions finished.
        *   **AUW (Active Users Weekly):** Unique wallets that have completed a task in the last 7 days.

2.  **Backend Integration (`lib/supabase.ts`):**
    *   Add `logView(projectId)` to be called by the widget.
    *   Add `fetchProjectStats(projectId)` to be called by the dashboard.

3.  **Widget Implementation (`Widget.tsx`):**
    *   Trigger `logView` when the widget initializes. This acts as both a "Page View" and a "Heartbeat" to show the widget is Online.

4.  **Dashboard UI (`Dashboard.tsx`):**
    *   Update `ProjectCard` to fetch and display these new metrics.
    *   Add a visual **"Online/Offline"** indicator badge:
        *   🟢 **Online:** Widget detected in the last 5 minutes.
        *   ⚫ **Offline:** No activity recently.
    *   Layout the stats in a clean grid within the card.

### **Verification:**
*   I will verify that loading the widget increments the visit count.
*   I will verify that the "Online" badge appears when the widget is active.
*   I will verify that the stats (Connected Wallets, Tasks) match the data in the database.