I will implement wallet-specific tracking for the Viral Boost tasks to ensure each user can earn rewards independently.

### **Problem:**
Currently, the "Viral Boost" (social sharing) status is stored in `localStorage` or component state without proper synchronization to the database for *specific actions* per user. This causes issues where one user's actions might not be persisted correctly across sessions, or the "shared" state is too ephemeral.

### **Plan:**

1.  **Database Updates (`supabase_schema.sql`):**
    *   Create a new table `viral_boost_completions` to track which user has completed which viral action (e.g., 'twitter_share', 'telegram_share') for a specific project.
    *   Columns: `id`, `user_id` (FK to end_users), `project_id` (FK to projects), `platform` (text), `created_at`.
    *   Add a unique constraint on `(user_id, project_id, platform)` to prevent double-claiming.

2.  **Widget Implementation (`Widget.tsx`):**
    *   **Fetch State:** On load (inside `initSupabase`), fetch the list of completed viral boosts for the current user from the new table.
    *   **Update State:** Populate the `sharedPlatforms` state with this data from the DB, merging it with any local state if necessary.
    *   **Save Action:** When a user successfully shares (after the 10s timer), insert a record into `viral_boost_completions` in addition to awarding XP.

3.  **Clean Up:**
    *   Remove reliance on `localStorage` for `sharedPlatforms` when a user is connected, as the DB is the source of truth.

### **Verification:**
*   I will verify that completing a share action adds a row to the database.
*   I will verify that refreshing the page (or reconnecting the wallet) properly loads the "checked" state for that specific platform.
*   I will verify that different wallets have independent share statuses.