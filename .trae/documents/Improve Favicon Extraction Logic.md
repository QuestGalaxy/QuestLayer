I will improve the favicon extraction logic to handle partial URLs and ensure it correctly parses the domain.

### **Problem:**
The current `getFaviconUrl` function in `Editor.tsx` fails when the user enters a URL that doesn't start with `http://` or `https://`, or if the URL constructor throws an error for other reasons (like just typing "s"). It also doesn't update the state effectively if the input is partial.

### **Plan:**

1.  **Enhance `getFaviconUrl`:**
    *   Prepend `https://` if the input string doesn't start with `http` to make the `URL` constructor happy.
    *   Add a debounce or stricter validation so it doesn't try to fetch a favicon for a single letter like "s".
    *   Only return a favicon URL if the hostname seems valid (contains a dot).

2.  **Update `Editor.tsx`:**
    *   Modify the `getFaviconUrl` helper function.
    *   Adjust the `useEffect` hook that auto-fills the icon field to be more robust.

### **Verification:**
*   I will verify that entering `google.com` correctly generates `https://www.google.com/s2/favicons?domain=google.com&sz=128`.
*   I will verify that typing "s" does *not* generate a broken favicon link.

**Improved Logic:**
```typescript
const getFaviconUrl = (link: string) => {
  try {
    let validLink = link;
    if (!validLink.startsWith('http://') && !validLink.startsWith('https://')) {
      validLink = `https://${validLink}`;
    }
    const url = new URL(validLink);
    if (!url.hostname || !url.hostname.includes('.')) return '';
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
  } catch {
    return '';
  }
};
```