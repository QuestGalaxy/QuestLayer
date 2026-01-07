I will replace the Flaticon image URLs with standard, reliable Lucide React icons styled to look like "gold/yellow game icons" as requested. This avoids external image dependencies and ensures consistent rendering.

### **Problem:**
The user wants "regular game icons" instead of the pixelated images I added. They specifically asked for "gold/yellow" icons.

### **Plan:**

1.  **Remove `PIXEL_ICONS` Array:**
    *   Delete the external image URLs.

2.  **Define Icon Fallback Logic:**
    *   Instead of storing a random *URL string* in the `icon` field, I need a way to tell the Widget "render a Gold Coin icon here".
    *   However, the `Task` interface expects `icon` to be a string (URL).
    *   **Solution:** I will use a special prefix or keyword (e.g., `icon:coin`, `icon:trophy`) in the `icon` field.
    *   Then, in `Widget.tsx` (and `Editor.tsx`), I will check if the icon string starts with `icon:` and render the corresponding Lucide component with yellow styling instead of an `<img>` tag.

3.  **Update `Widget.tsx` & `Editor.tsx`:**
    *   Modify the rendering logic to support these "preset icons".
    *   Update `getRandomPixelIcon` (rename to `getRandomGameIcon`) to return one of these preset strings.

### **Icon Mapping:**
*   `icon:coin` -> `Coins` (Lucide)
*   `icon:trophy` -> `Trophy` (Lucide)
*   `icon:gem` -> `Gem` (Lucide)
*   `icon:sword` -> `Sword` (Lucide)
*   `icon:crown` -> `Crown` (Lucide)

### **Verification:**
*   I will verify that a task with `icon:coin` renders a yellow Coin icon.
*   I will verify that the fallback logic assigns one of these codes randomly.

**Refined Plan:**
Since changing the data structure to support non-URL icons involves updating multiple files (`Widget.tsx`, `Editor.tsx`, `LandingPage.tsx` maybe?), I will implement this robustly.

**Step 1:** Update `Editor.tsx` to use the special strings.
**Step 2:** Update `Widget.tsx` to parse these strings and render components.
**Step 3:** Update `Editor.tsx` (preview list) to also render them correctly.