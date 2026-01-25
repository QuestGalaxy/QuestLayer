#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_ORIGIN = 'https://questlayer.app';

const args = process.argv.slice(2);
const originArgIndex = args.findIndex((arg) => arg === '--origin');
const origin = originArgIndex >= 0 && args[originArgIndex + 1]
  ? args[originArgIndex + 1]
  : DEFAULT_ORIGIN;

const maxRedirects = 6;
const concurrency = 4;

const normalizeOrigin = (value) => {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return value;
  }
};

const normalizedOrigin = normalizeOrigin(origin);

const parseSlidingLinks = () => {
  const filePath = path.resolve(process.cwd(), 'constants.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/export const STORE_SLIDING_LINKS = \[([\s\S]*?)\];/);
  if (!match) {
    throw new Error('STORE_SLIDING_LINKS not found in constants.ts');
  }
  const block = match[1];
  const domains = [];
  const domainRegex = /domain:\s*'([^']+)'/g;
  let domainMatch;
  while ((domainMatch = domainRegex.exec(block)) !== null) {
    domains.push(domainMatch[1]);
  }
  return Array.from(new Set(domains));
};

const toUrl = (domain) => {
  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    return domain;
  }
  return `https://${domain}`;
};

const isSameOrigin = (a, b) => {
  return normalizeOrigin(a) === normalizeOrigin(b);
};

const tokenMatchesOrigin = (token, originValue) => {
  if (!token) return false;
  if (token === '*') return true;
  if (token === "'self'") return false;
  if (token === "'none'") return false;
  if (token === originValue) return true;
  if (token.startsWith('http://') || token.startsWith('https://')) {
    if (token.includes('*')) {
      const escaped = token.replace(/[.+?^${}()|[\\]\\\\]/g, '\\$&').replace(/\\*/g, '.*');
      try {
        return new RegExp(`^${escaped}$`).test(originValue);
      } catch {
        return false;
      }
    }
    return normalizeOrigin(token) === normalizeOrigin(originValue);
  }
  return false;
};

const parseFrameAncestors = (cspHeader) => {
  if (!cspHeader) return null;
  const directives = cspHeader.split(';').map((part) => part.trim()).filter(Boolean);
  const frameAncestors = directives.find((dir) => dir.startsWith('frame-ancestors '));
  if (!frameAncestors) return null;
  const tokens = frameAncestors.replace('frame-ancestors', '').trim().split(/\\s+/).filter(Boolean);
  return tokens.length ? tokens : null;
};

const classify = ({ url, headers }) => {
  const xfo = headers.get('x-frame-options');
  const csp = headers.get('content-security-policy') || headers.get('content-security-policy-report-only');
  const frameAncestors = parseFrameAncestors(csp);

  const reasons = [];

  if (frameAncestors) {
    if (frameAncestors.includes("'none'")) {
      reasons.push('CSP frame-ancestors none');
      return { status: 'BLOCK', reasons, xfo, csp };
    }

    if (frameAncestors.includes('*')) {
      reasons.push('CSP frame-ancestors *');
    } else if (frameAncestors.includes("'self'")) {
      if (isSameOrigin(url, normalizedOrigin)) {
        reasons.push('CSP frame-ancestors self (matches origin)');
      } else {
        reasons.push('CSP frame-ancestors self (different origin)');
        return { status: 'BLOCK', reasons, xfo, csp };
      }
    }

    const hasExplicit = frameAncestors.some((token) => tokenMatchesOrigin(token, normalizedOrigin));
    if (!hasExplicit && !frameAncestors.includes('*') && !frameAncestors.includes("'self'")) {
      reasons.push('CSP frame-ancestors missing origin');
      return { status: 'BLOCK', reasons, xfo, csp };
    }
  }

  if (xfo) {
    const value = xfo.toLowerCase();
    if (value.includes('deny')) {
      reasons.push('X-Frame-Options DENY');
      return { status: 'BLOCK', reasons, xfo, csp };
    }
    if (value.includes('sameorigin')) {
      if (!isSameOrigin(url, normalizedOrigin)) {
        reasons.push('X-Frame-Options SAMEORIGIN');
        return { status: 'BLOCK', reasons, xfo, csp };
      }
    }
    if (value.includes('allow-from')) {
      const parts = value.split('allow-from').map((part) => part.trim()).filter(Boolean);
      const allowed = parts.length > 0 ? parts[0] : '';
      if (!allowed || !isSameOrigin(allowed, normalizedOrigin)) {
        reasons.push('X-Frame-Options ALLOW-FROM mismatch');
        return { status: 'BLOCK', reasons, xfo, csp };
      }
    }
  }

  if (frameAncestors || xfo) {
    reasons.push('Headers allow embedding');
    return { status: 'ALLOW', reasons, xfo, csp };
  }

  return { status: 'UNKNOWN', reasons: ['No CSP/XFO headers'], xfo, csp };
};

const fetchWithRedirects = async (url, depth = 0) => {
  if (depth > maxRedirects) {
    throw new Error('Too many redirects');
  }
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9'
    }
  });
  if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
    const nextUrl = new URL(res.headers.get('location'), url).toString();
    return fetchWithRedirects(nextUrl, depth + 1);
  }
  return { url, res };
};

const runQueue = async (items, handler) => {
  const results = [];
  let index = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      const result = await handler(current);
      results.push(result);
    }
  });

  await Promise.all(workers);
  return results;
};

const main = async () => {
  const domains = parseSlidingLinks();
  const checks = await runQueue(domains, async (domain) => {
    const url = toUrl(domain);
    try {
      const { url: finalUrl, res } = await fetchWithRedirects(url);
      if (res.status >= 400) {
        return {
          domain,
          url: finalUrl,
          status: 'UNKNOWN',
          reasons: [`HTTP ${res.status}`]
        };
      }
      const classification = classify({ url: finalUrl, headers: res.headers });
      return { domain, url: finalUrl, ...classification };
    } catch (error) {
      return { domain, url, status: 'UNKNOWN', reasons: [String(error?.message || error)] };
    }
  });

  const sorted = checks.sort((a, b) => a.domain.localeCompare(b.domain));
  console.log(`Origin: ${normalizedOrigin}`);
  console.log('---');
  sorted.forEach((item) => {
    const reasons = item.reasons.join('; ');
    console.log(`${item.status}\\t${item.domain}\\t${item.url}\\t${reasons}`);
  });
  process.exit(0);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
