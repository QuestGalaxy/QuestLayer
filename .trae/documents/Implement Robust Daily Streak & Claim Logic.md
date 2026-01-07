I will implement robust daily streak logic to ensure each user's daily tasks work correctly based on a 5-day streak cycle.

### **Problem:**
The current implementation has basic streak logic in the frontend (`Widget.tsx`), but:
1.  **Timezone Issues:** `toDateString()` checks against local time, which can be inconsistent if the user changes timezones or devices. It's safer to use UTC dates or the server's timestamp.
2.  **Streak Reset:** There is no logic to **reset** the streak to 1 if the user misses a day (i.e., if `last_claim_date` was more than 1 day ago).
3.  **DB Synchronization:** The logic relies on `last_claim_date` from the DB but performs the "is claimable" check on the client.

### **Plan:**

1.  **Database Updates (`supabase_schema.sql`):**
    *   Create a robust RPC function `claim_daily_bonus(user_id)` in PostgreSQL.
    *   **Logic inside RPC:**
        *   Get the `last_claim_date` for the user.
        *   If `last_claim_date` is today (UTC), return "Already claimed".
        *   If `last_claim_date` was yesterday (UTC), increment streak (max 5).
        *   If `last_claim_date` was older than yesterday, **reset streak to 1**.
        *   Calculate bonus based on the (new) streak: `100 * 2^(streak - 1)`.
        *   Update `user_progress` with new XP, new Streak, and `now()`.
        *   Return the awarded bonus and new streak.

2.  **Widget Implementation (`Widget.tsx`):**
    *   Update `claimDaily` to call this new RPC function instead of doing math on the client.
    *   Update the `initSupabase` effect to correctly check "is claimable" by comparing `last_claim_date` (from DB) with `new Date()` (UTC) to set the initial button state.
    *   This ensures that if a user misses a day, the UI correctly shows "Day 1" (reset) instead of continuing a broken streak.

### **Verification:**
*   I will verify that claiming 2 days in a row increments the streak.
*   I will verify that missing a day resets the streak to Day 1.
*   I will verify that multiple claims in the same day are prevented.