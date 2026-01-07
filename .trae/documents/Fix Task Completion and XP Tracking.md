I will fix the task completion logic in the `Widget.tsx` component to ensuring that newly added tasks (which might not be in the initial map) are correctly handled and that their XP is awarded both locally and in the database.

### **Problem:**
The user is adding new tasks (likely via the Editor), but when completing them in the Widget:
1.  **XP Not Increasing:** The local optimistic update might be failing or being overwritten.
2.  **Analytics Not Updating:** The `task_completions` insert is likely failing because `dbTaskId` is undefined.
3.  **Root Cause:** The `taskMap` (which maps local task IDs to Supabase UUIDs) is only built **once** on mount. If new tasks are added to the widget config (e.g., via the `data-config` attribute update or re-render), the widget might not have the corresponding Supabase UUIDs for them if it doesn't re-fetch or re-map.
    *   Also, the code: `const dbTaskId = taskMap[task.id];` inside `startQuest` returns `undefined` for new tasks that haven't been synced to the `taskMap`.

### **Plan:**

1.  **Enhance `Widget.tsx` Logic:**
    *   **Dynamic Task Lookup:** Instead of relying solely on a static `taskMap` state built on mount, I will modify `startQuest` to attempt to find the task in the DB by **title** (and project_id) if the ID mapping is missing.
    *   **XP Update Fix:** Ensure the optimistic XP update happens regardless of DB connectivity (for preview mode), and that the DB update (if connected) correctly adds the XP.
    *   **Refetch Stats:** After a successful completion, trigger a background refresh of the global/user stats to ensure the UI stays in sync.

2.  **Debugging:**
    *   Add more robust logging in `startQuest` to see exactly why `dbTaskId` might be missing.

### **Verification:**
*   I will verify that completing a task now sends the correct `INSERT` to `task_completions`.
*   I will verify that the `user_progress` table is updated with the new XP.

**Critical Fix in `startQuest`:**
```typescript
// Inside startQuest completion block:
let dbTaskId = taskMap[task.id];

// Fallback: If not in map, try to find it by title in the DB right now
if (!dbTaskId && dbProjectId) {
  const { data: foundTask } = await supabase
    .from('tasks')
    .select('id')
    .eq('project_id', dbProjectId)
    .eq('title', task.title)
    .single();
  if (foundTask) dbTaskId = foundTask.id;
}

if (dbTaskId) {
   // Proceed with insert...
} else {
   console.error("Task not found in DB, cannot track completion");
}
```