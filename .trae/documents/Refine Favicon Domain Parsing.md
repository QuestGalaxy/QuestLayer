I will further robustify the favicon URL extraction logic to handle cases where the user types "key2we3.com" (which is technically valid but the previous regex might be too strict or the `URL` constructor is tricky with incomplete TLDs).

### **Problem:**
The user input `key2we3.com` resulted in `key2web3.` being sent to the favicon service. This suggests that the `URL` constructor or the extraction logic might be stripping the TLD or misinterpreting the input if it doesn't look exactly like a standard hostname.

Actually, looking at the previous logic:
```typescript
if (!url.hostname || !url.hostname.includes('.')) return '';
return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
```
If the input is `key2web3.com`, `new URL('https://key2web3.com')` should give `hostname: 'key2web3.com'`. The issue might be that the user typed `key2web3.com` but maybe with a trailing dot or some other character, OR the `google` service itself is redirecting weirdly.

However, the user said "it wrote this: `...domain=key2web3.&sz=128`". This trailing dot usually happens if the input to `URL` was `https://key2web3.com.` or similar.

I will make the logic cleaner to:
1.  **Strip trailing dots/slashes** from the hostname.
2.  **Ensure valid TLD** (at least 2 chars after the last dot).

### **Plan:**

1.  **Update `getFaviconUrl` in `Editor.tsx`:**
    *   Clean the input string more aggressively (trim, remove trailing punctuation).
    *   Explicitly handle the `hostname` to remove any trailing dots that might sneak in.
    *   Add a regex check to ensure the domain looks like `example.com`.

### **Verification:**
*   `key2web3.com` -> `key2web3.com`
*   `key2web3.com/` -> `key2web3.com`
*   `https://key2web3.com` -> `key2web3.com`

**Improved Code:**
```typescript
  const getFaviconUrl = (link: string) => {
    try {
      if (!link || link.length < 4) return '';
      let validLink = link.trim();
      // Remove trailing slashes or dots which might confuse the parser
      validLink = validLink.replace(/[\/.]+$/, ''); 
      
      if (!validLink.startsWith('http://') && !validLink.startsWith('https://')) {
        validLink = `https://${validLink}`;
      }
      
      const url = new URL(validLink);
      let hostname = url.hostname;
      
      // Double check: remove trailing dot if URL constructor left it (rare but possible in some DNS contexts)
      if (hostname.endsWith('.')) {
        hostname = hostname.slice(0, -1);
      }

      // Ensure it looks like a domain (x.xx)
      if (!hostname.includes('.') || hostname.split('.').pop()?.length! < 2) return '';
      
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
    } catch {
      return '';
    }
  };
```