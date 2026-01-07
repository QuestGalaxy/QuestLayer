I will fix the premature favicon extraction in `Editor.tsx` by adding a **debounce** and ensuring that the extraction only triggers once the domain entry is reasonably finished.

### **Problem:**
The `useEffect` that extracts the favicon triggers on **every keystroke** in the `link` field. This causes the extraction to fire for partial domains like `key2web3.co` before the user finishes typing `key2web3.com`, leading to broken or incorrect favicon URLs.

### **Plan:**

1.  **Introduce a Debounce:**
    *   Modify the `useEffect` that listens to `editForm.link` to wait for a short period (e.g., 800ms) of inactivity before attempting to extract the favicon.
    *   This ensures that the user has likely finished typing the domain before we try to guess the icon.

2.  **Refine Extraction Logic:**
    *   Keep the improved `getFaviconUrl` logic but call it inside the debounced effect.

### **Verification:**
*   I will verify that typing `key2web3.com` slowly doesn't result in `key2web3.co` being the final icon.

**Improved `useEffect` in `Editor.tsx`:**
```typescript
  useEffect(() => {
    if (!editForm) return;
    if (editForm.icon) return;
    
    // Debounce favicon extraction
    const timeoutId = setTimeout(() => {
      const faviconUrl = getFaviconUrl(editForm.link);
      if (!faviconUrl) return;
      setEditForm(prev => (prev ? { ...prev, icon: faviconUrl } : null));
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [editForm?.link, editForm?.icon]);
```