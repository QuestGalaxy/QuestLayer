import type { MouseEvent } from 'react';

export function staticPageHref(path: string) {
  // Vercel serves these existing public pages at their clean canonical URLs.
  return import.meta.env.DEV ? `${path}/index.html` : path;
}

export function followLandingLink(event: MouseEvent<HTMLAnchorElement>, action: () => void) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  action();
}
