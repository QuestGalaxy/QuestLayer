import { createClient } from '@supabase/supabase-js';

const MAX_HTML_SIZE = 1_000_000;
const FETCH_TIMEOUT_MS = 9000;
const MAX_SITEMAPS = 3;
const MAX_SITEMAP_URLS = 200;
const AI_DESCRIPTION_MAX = 360;
const AI_TITLE_MAX_WORDS = 3;

const parseBody = async (req: any) => {
  if (req.body) {
    if (typeof req.body === 'string') {
      return JSON.parse(req.body);
    }
    return req.body;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
};

const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials.');
  }

  return createClient(supabaseUrl, supabaseKey);
};

const shouldUseAiRewrite = () => {
  const flag = process.env.INGEST_USE_AI;
  if (flag === '0' || flag === 'false') return false;
  return true;
};

const getOllamaConfig = () => {
  const url = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
  return { url, model };
};

const fetchWithTimeout = async (url: string, init?: RequestInit, timeoutMs = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'User-Agent': 'QuestLayerIngestBot/1.0',
        ...(init?.headers || {})
      }
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
};

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
];

const isBotWall = (html: string) => {
  const signal = html.toLowerCase();
  return signal.includes('just a moment')
    || signal.includes('cf-browser-verification')
    || signal.includes('cf-chl')
    || signal.includes('attention required')
    || signal.includes('cloudflare')
    || signal.includes('captcha')
    || signal.includes('access denied');
};

const fetchHtmlWithRetry = async (url: string) => {
  for (let i = 0; i < USER_AGENTS.length; i += 1) {
    try {
      const res = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': USER_AGENTS[i],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!res.ok) continue;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) continue;
      const html = (await res.text()).slice(0, MAX_HTML_SIZE);
      if (isBotWall(html)) continue;
      return html;
    } catch {
      continue;
    }
  }
  return null;
};

const fetchHtmlWithPlaywright = async (url: string) => {
  const allowPlaywright = process.env.INGEST_USE_PLAYWRIGHT === 'true' || process.env.INGEST_USE_PLAYWRIGHT === '1';
  if (!allowPlaywright) return null;
  try {
    const playwright = await import('playwright');
    const browser = await playwright.chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled']
    });
    const context = await browser.newContext({
      userAgent: USER_AGENTS[0],
      viewport: { width: 1280, height: 720 },
      locale: 'en-US'
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    await page.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (type === 'image' || type === 'font') return route.abort();
      return route.continue();
    });
    await page.goto(url, { waitUntil: 'networkidle', timeout: FETCH_TIMEOUT_MS });
    await page.waitForTimeout(1200);
    const html = await page.content();
    await context.close();
    await browser.close();
    if (!html) return null;
    if (isBotWall(html)) return null;
    return html.slice(0, MAX_HTML_SIZE);
  } catch {
    return null;
  }
};

const fetchHtmlViaJina = async (url: string) => {
  try {
    const target = `https://r.jina.ai/http://${url.replace(/^https?:\/\//i, '')}`;
    const res = await fetchWithTimeout(target, {
      headers: {
        'User-Agent': USER_AGENTS[0],
        'Accept': 'text/plain'
      }
    });
    if (!res.ok) return null;
    const text = (await res.text()).slice(0, MAX_HTML_SIZE);
    if (!text) return null;
    return text;
  } catch {
    return null;
  }
};

const parseJinaTitle = (text: string) => {
  const match = text.match(/^Title:\s*(.+)$/m);
  return match?.[1]?.trim() || null;
};

const stripJinaHeader = (text: string) => {
  const marker = 'Markdown Content:';
  const idx = text.indexOf(marker);
  if (idx === -1) return text;
  return text.slice(idx + marker.length).trim();
};

const cleanJinaDescription = (text: string, title?: string | null) => {
  const stripped = stripJinaHeader(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\((?:https?:\/\/)?[^)]+\)/g, '$1')
    .replace(/#+\s*/g, '')
    .replace(/_{2,}/g, ' ')
    .replace(/={2,}/g, ' ')
    .replace(/-{2,}/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const raw = stripped
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/opens in a new window/i.test(line))
    .filter((line) => !/open in a new window/i.test(line))
    .filter((line) => !/external website/i.test(line))
    .filter((line) => !/skip to content/i.test(line))
    .filter((line) => !/^menu$/i.test(line))
    .filter((line) => !/cookie/i.test(line))
    .filter((line) => !/privacy/i.test(line))
    .filter((line) => !/terms/i.test(line))
    .filter((line) => !/copyright/i.test(line))
    .filter((line) => !/all rights reserved/i.test(line))
    .filter((line) => !/opens an external website/i.test(line))
    .filter((line) => !/image\s*\d+/i.test(line));

  const content = raw.join(' ').replace(/\s{2,}/g, ' ').trim();
  const safeTitle = (title || '').toLowerCase();
  const withoutTitle = safeTitle
    ? content.replace(new RegExp(`\\b${safeTitle.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'ig'), '').trim()
    : content;

  const sentences = withoutTitle
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 20);
  const picked = sentences.slice(0, 2).join(' ');
  return picked.length > 0 ? picked : content;
};

const extractLinksFromText = (text: string) => {
  const results: string[] = [];
  const regex = /https?:\/\/[^\s)]+/g;
  let match;
  while ((match = regex.exec(text))) {
    results.push(match[0]);
  }
  return results;
};

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withScheme);
  url.hash = '';
  return url.toString();
};

const extractMetaContent = (html: string, key: string) => {
  const metaTag = new RegExp(
    `<meta[^>]+(?:property|name)=[\\"']${key}[\\"'][^>]*>`,
    'i'
  );
  const match = html.match(metaTag);
  if (!match) return null;
  const tag = match[0];
  const contentMatch = tag.match(/content=[\\"']([^\\"']+)[\\"']/i);
  return contentMatch ? contentMatch[1] : null;
};

const extractTitle = (html: string) => {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() || null;
};

const extractH1 = (html: string) => {
  const match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return match?.[1]?.trim() || null;
};

const cleanTitle = (raw: string | null) => {
  if (!raw) return null;
  let value = raw.trim();
  const separators = ['|', '·', '—', '–', '-', ':'];
  for (const sep of separators) {
    if (value.includes(sep)) {
      value = value.split(sep)[0];
    }
  }
  value = value.replace(/\s{2,}/g, ' ').trim();
  // Keep titles short for SEO (1-3 words max).
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length > AI_TITLE_MAX_WORDS) {
    value = words.slice(0, AI_TITLE_MAX_WORDS).join(' ');
  }
  return value;
};

const extractLinks = (html: string, baseUrl: string) => {
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  const results: string[] = [];
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html))) {
    const href = linkMatch?.[1];
    if (!href || href.startsWith('mailto:') || href.startsWith('javascript:')) continue;
    try {
      const absolute = new URL(href, baseUrl).toString();
      results.push(absolute);
    } catch {
      continue;
    }
  }
  return results;
};

const scoreSocialLink = (link: string, tokens: string[]) => {
  const lower = link.toLowerCase();
  let score = 0;
  tokens.forEach((token) => {
    if (!token) return;
    if (lower.includes(token)) score += 2;
  });
  if (link.length < 60) score += 1;
  return score;
};

const extractSocials = (links: string[], tokens: string[] = []) => {
  const socialRules = [
    { key: 'twitter', hosts: ['twitter.com', 'x.com'] },
    { key: 'discord', hosts: ['discord.gg', 'discord.com'] },
    { key: 'telegram', hosts: ['t.me', 'telegram.me'] },
    { key: 'github', hosts: ['github.com'] },
    { key: 'medium', hosts: ['medium.com'] },
    { key: 'linkedin', hosts: ['linkedin.com'] },
    { key: 'youtube', hosts: ['youtube.com', 'youtu.be'] },
    { key: 'instagram', hosts: ['instagram.com'] },
    { key: 'tiktok', hosts: ['tiktok.com'] },
    { key: 'facebook', hosts: ['facebook.com', 'fb.com'] }
  ];
  const socials: Record<string, string> = {};
  const scores: Record<string, number> = {};
  for (const href of links) {
    let host = '';
    try {
      host = new URL(href).hostname.replace(/^www\./, '');
    } catch {
      continue;
    }
    for (const rule of socialRules) {
      const matched = rule.hosts.some((domain) => host === domain || host.endsWith(`.${domain}`));
      if (matched) {
        const nextScore = scoreSocialLink(href, tokens);
        if (!scores[rule.key] || nextScore > scores[rule.key]) {
          socials[rule.key] = href;
          scores[rule.key] = nextScore;
        }
      }
    }
    if (Object.keys(socials).length >= socialRules.length) break;
  }
  return socials;
};

const extractIconHref = (html: string, relValue: string) => {
  const linkTag = new RegExp(
    `<link[^>]+rel=[\\"'][^\\"']*${relValue}[^\\"']*[\\\"'][^>]*>`,
    'i'
  );
  const match = html.match(linkTag);
  if (!match) return null;
  const tag = match[0];
  const hrefMatch = tag.match(/href=[\\"']([^\\"']+)[\\"']/i);
  return hrefMatch ? hrefMatch[1] : null;
};

const resolveUrl = (value: string | null, baseUrl: string) => {
  if (!value) return null;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
};

const getFaviconUrl = (link: string) => {
  try {
    if (!link || link.length < 4) return '';
    let validLink = link.trim();
    validLink = validLink.replace(/[\/.]+$/, '');
    if (!validLink.startsWith('http://') && !validLink.startsWith('https://')) {
      validLink = `https://${validLink}`;
    }
    const url = new URL(validLink);
    let hostname = url.hostname;
    if (hostname.endsWith('.')) hostname = hostname.slice(0, -1);
    const parts = hostname.split('.');
    if (parts.length < 2 || parts[parts.length - 1].length < 2) return '';
    return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=128`;
  } catch {
    return '';
  }
};

const extractKeywords = (text: string) => {
  const stop = new Set([
    'the','and','for','with','from','that','this','your','you','are','our','their','into','over','about','more','less','was','were','has','have','will','can','all','any','its','it','on','in','at','by','to','of','a','an','as','or'
  ]);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stop.has(w));
  const counts: Record<string, number> = {};
  words.forEach(w => { counts[w] = (counts[w] || 0) + 1; });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);
};

const clampDescription = (value: string, max = 180) => {
  if (value.length <= max) return value;
  return value.slice(0, max - 1).trimEnd() + '…';
};

const normalizeSeoText = (value: string) => {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s+\./g, '.')
    .trim();
};

const getNgrams = (text: string, size: number) => {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const grams: string[] = [];
  if (words.length < size) return grams;
  for (let i = 0; i <= words.length - size; i += 1) {
    grams.push(words.slice(i, i + size).join(' '));
  }
  return grams;
};

const isTooSimilar = (value: string, source?: string | null) => {
  if (!value || !source) return false;
  const cleanedValue = value.toLowerCase();
  const grams = getNgrams(source, 6);
  return grams.some((gram) => cleanedValue.includes(gram));
};

const extractJsonObject = (value: string) => {
  const start = value.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < value.length; i += 1) {
    const char = value[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        const slice = value.slice(start, i + 1);
        try {
          return JSON.parse(slice);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
};

const buildAiPrompt = (payload: {
  domain: string;
  rawTitle?: string | null;
  cleanedTitle?: string | null;
  h1?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  avoidPhrases?: string[];
}) => {
  const avoidLine = payload.avoidPhrases && payload.avoidPhrases.length > 0
    ? `Avoid verbatim phrases from: ${payload.avoidPhrases.join(' | ')}`
    : '';
  return [
    'You rewrite project SEO copy into original wording.',
    'Return ONLY valid JSON with keys: "title", "description".',
    'Title: 1-3 words, keep the brand name, no punctuation.',
    `Description: 2-3 sentences, original wording, mention QuestLayer missions/rewards, max ${AI_DESCRIPTION_MAX} characters, no markdown.`,
    'Do not include code fences or extra commentary.',
    'Do not copy verbatim from inputs.',
    avoidLine,
    '',
    `Input: ${JSON.stringify(payload)}`
  ].filter(Boolean).join('\n');
};

const rewriteSeoCopyWithAi = async (payload: {
  domain: string;
  rawTitle?: string | null;
  cleanedTitle?: string | null;
  h1?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
}) => {
  if (!shouldUseAiRewrite()) return null;
  const { url, model } = getOllamaConfig();
  const prompt = buildAiPrompt(payload);

  try {
    const res = await fetchWithTimeout(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { temperature: 0.4 }
      })
    }, 12000);
    if (!res.ok) return null;
    const data = await res.json();
    const outputText = typeof data?.response === 'string' ? data.response.trim() : '';
    if (!outputText) return null;
    const parsed = extractJsonObject(outputText);
    if (!parsed || typeof parsed !== 'object') return null;
    let title = typeof parsed.title === 'string' ? parsed.title.trim() : null;
    let description = typeof parsed.description === 'string' ? parsed.description.trim() : null;

    if (description && isTooSimilar(description, payload.metaDescription)) {
      const retryPrompt = buildAiPrompt({
        ...payload,
        avoidPhrases: [payload.metaDescription ?? '']
      });
      const retryRes = await fetchWithTimeout(`${url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: retryPrompt,
          stream: false,
          options: { temperature: 0.6 }
        })
      }, 12000);
      if (retryRes.ok) {
        const retryData = await retryRes.json();
        const retryText = typeof retryData?.response === 'string' ? retryData.response.trim() : '';
        const retryParsed = extractJsonObject(retryText);
        if (retryParsed && typeof retryParsed === 'object') {
          title = typeof retryParsed.title === 'string' ? retryParsed.title.trim() : title;
          description = typeof retryParsed.description === 'string' ? retryParsed.description.trim() : description;
        }
      }
    }

    if (!title && !description) return null;
    return { title, description };
  } catch {
    return null;
  }
};

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pickOne = (items: string[]) => items[Math.floor(Math.random() * items.length)];

const buildSeoDescription = (name: string, hostname: string, metaDesc?: string | null, metaKeywords?: string | null) => {
  const cleanedMetaDesc = metaDesc
    ? metaDesc.replace(new RegExp(`^${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*[|:-]\\s*`, 'i'), '')
      .replace(new RegExp(`^${hostname.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*[|:-]\\s*`, 'i'), '')
      .trim()
    : null;
  const keywordList = metaKeywords
    ? metaKeywords.split(',').map(k => k.trim()).filter(Boolean).slice(0, 4)
    : (cleanedMetaDesc ? extractKeywords(cleanedMetaDesc).slice(0, 4) : []);
  const keywordsText = keywordList.length ? keywordList.join(', ') : null;

  const leadLine = cleanedMetaDesc
    ? `${name} ${cleanedMetaDesc.replace(/\.+$/g, '')}.`
    : pickOne([
      `${name} is a leading web3 project building the next generation of decentralized infrastructure.`,
      `${name} is a modern blockchain ecosystem focused on scalable, secure applications.`,
      `${name} is a next-gen protocol designed to power community-driven growth.`,
      `${name} is a forward‑looking network built for builders, creators, and users.`
    ]);

  const questLine = pickOne([
    `On QuestLayer, you can explore the ecosystem, complete community missions, and earn rewards while learning about ${name}.`,
    `On QuestLayer, explore ${name}, finish missions, and earn rewards as you learn how the ecosystem works.`,
    `On QuestLayer, discover ${name}, complete quests, and collect rewards through guided community tasks.`
  ]);

  const keywordLine = keywordsText
    ? `Key themes include ${keywordsText}.`
    : `Learn the essentials, explore official resources, and get started faster.`;

  const parts = [leadLine, questLine, keywordLine];
  return clampDescription(parts.join(' '), AI_DESCRIPTION_MAX);
};

const parseRobotsForSitemaps = (robotsText: string) => {
  const lines = robotsText.split('\n');
  const sitemaps: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.toLowerCase().startsWith('sitemap:')) continue;
    const value = trimmed.split(':').slice(1).join(':').trim();
    if (value) sitemaps.push(value);
  }
  return sitemaps;
};

const extractSitemapUrls = (xml: string) => {
  const urls: string[] = [];
  const locRegex = /<loc>([^<]+)<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml))) {
    if (match[1]) urls.push(match[1].trim());
  }
  return urls;
};

const discoverSitemapUrls = async (origin: string) => {
  try {
    const res = await fetchWithTimeout(`${origin}/robots.txt`);
    if (!res.ok) return [];
    const text = await res.text();
    const sitemaps = parseRobotsForSitemaps(text);
    return sitemaps.slice(0, MAX_SITEMAPS);
  } catch {
    return [];
  }
};

const collectSiteUrls = async (origin: string) => {
  const sitemaps = await discoverSitemapUrls(origin);
  const urls: string[] = [];
  for (const sitemap of sitemaps) {
    try {
      const res = await fetchWithTimeout(sitemap);
      if (!res.ok) continue;
      const xml = await res.text();
      const extracted = extractSitemapUrls(xml);
      urls.push(...extracted);
      if (urls.length >= MAX_SITEMAP_URLS) break;
    } catch {
      continue;
    }
  }
  return urls.slice(0, MAX_SITEMAP_URLS);
};

const pickUrlByPattern = (urls: string[], patterns: RegExp[]) => {
  for (const pattern of patterns) {
    const match = urls.find((u) => pattern.test(u));
    if (match) return match;
  }
  return null;
};

const computeSeoScore = (payload: {
  description?: string | null;
  ogImage?: string | null;
  logoUrl?: string | null;
  socials?: Record<string, string>;
  sitemapUrls?: string[];
  title?: string | null;
  hostname?: string | null;
}) => {
  let score = 0;
  if (payload.description && payload.description.trim().length > 40) score += 2;
  if (payload.ogImage) score += 2;
  if (payload.logoUrl) score += 1;
  if (payload.socials && Object.keys(payload.socials).length > 0) score += 1;
  if (payload.sitemapUrls && payload.sitemapUrls.length > 0) score += 1;
  if (payload.title && payload.hostname && payload.title.toLowerCase() !== payload.hostname.toLowerCase()) score += 1;
  return score;
};

const getXpRewards = (seoScore: number) => {
  const clamped = Math.max(0, Math.min(seoScore, 8));
  const mission = 40 + clamped * 5; // 40-80
  const quiz = 80 + clamped * 10; // 80-160
  return { mission, quiz };
};

const buildXpSet = (base: number, spread: number) => {
  const values = [base - spread, base, base + spread].map((value) => Math.max(10, Math.round(value)));
  return shuffle(values);
};

const buildTasks = (
  projectUrl: string,
  name: string,
  hostname: string,
  socials: Record<string, string>,
  sitemapUrls: string[],
  seoScore: number
) => {
  const tasks: any[] = [];
  const rewards = getXpRewards(seoScore);
  const missionXp = buildXpSet(rewards.mission, 5);
  const quizXp = buildXpSet(rewards.quiz, 10);
  const addTask = (title: string, link: string, order: number, desc: string) => {
    tasks.push({
      title,
      task_kind: 'link',
      task_section: 'missions',
      link,
      xp_reward: missionXp[order] ?? rewards.mission,
      order_index: order,
      description: desc
    });
  };

  const linkCandidates: { title: string; link: string; desc: string }[] = [];
  linkCandidates.push({
    title: 'Visit Website',
    link: projectUrl,
    desc: `Explore the official ${name} website.`
  });

  const socialEntries = [
    { key: 'twitter', title: 'Follow on X', desc: `Follow ${name} on X for updates.` },
    { key: 'discord', title: 'Join Discord', desc: `Join the ${name} Discord community.` },
    { key: 'telegram', title: 'Join Telegram', desc: `Join the ${name} Telegram community.` },
    { key: 'github', title: 'View GitHub', desc: `Review ${name} repositories on GitHub.` },
    { key: 'medium', title: 'Read Blog', desc: `Read the latest ${name} updates.` }
  ];
  socialEntries.forEach((entry) => {
    if (socials[entry.key]) {
      linkCandidates.push({ title: entry.title, link: socials[entry.key], desc: entry.desc });
    }
  });

  const docsUrl = pickUrlByPattern(sitemapUrls, [/\/docs\b/i, /\/documentation\b/i, /\/docs\//i]);
  if (docsUrl) {
    linkCandidates.push({
      title: 'Read Docs',
      link: docsUrl,
      desc: `Review the ${name} documentation.`
    });
  }

  const blogUrl = pickUrlByPattern(sitemapUrls, [/\/blog\b/i, /\/news\b/i, /\/updates\b/i]);
  if (blogUrl) {
    linkCandidates.push({
      title: 'Read Blog',
      link: blogUrl,
      desc: `Catch the latest ${name} updates.`
    });
  }

  const appUrl = pickUrlByPattern(sitemapUrls, [/\/app\b/i, /\/launch\b/i, /\/dashboard\b/i]);
  if (appUrl) {
    linkCandidates.push({
      title: 'Open App',
      link: appUrl,
      desc: `Launch the ${name} app experience.`
    });
  }

  const uniqueLinks = new Map<string, { title: string; link: string; desc: string }>();
  linkCandidates.forEach((candidate) => {
    if (!candidate.link) return;
    if (uniqueLinks.size >= 6) return;
    if (!uniqueLinks.has(candidate.link)) {
      uniqueLinks.set(candidate.link, candidate);
    }
  });

  const finalLinks = Array.from(uniqueLinks.values()).slice(0, 3);
  while (finalLinks.length < 3) {
    finalLinks.push({
      title: `Explore ${name}`,
      link: projectUrl,
      desc: `Learn more about ${name} on the official site.`
    });
  }

  finalLinks.forEach((item, idx) => addTask(item.title, item.link, idx, item.desc));

  const primaryCommunity = socials.discord
    ? 'discord'
    : socials.twitter
      ? 'twitter'
      : socials.telegram
        ? 'telegram'
        : socials.github
          ? 'github'
          : 'community';

  const quizTasks = [
    {
      title: 'Project Name',
      task_kind: 'quiz',
      task_section: 'onboarding',
      question: 'What is this project called?',
      answer: name,
      description: 'Answer the project name to continue.',
      xp_reward: quizXp[0] ?? rewards.quiz,
      order_index: 0
    },
    {
      title: 'Official Domain',
      task_kind: 'quiz',
      task_section: 'onboarding',
      question: 'Which domain hosts the official site?',
      answer: hostname,
      description: 'Type the main domain of the project.',
      xp_reward: quizXp[1] ?? rewards.quiz,
      order_index: 1
    },
    {
      title: 'Community Channel',
      task_kind: 'quiz',
      task_section: 'onboarding',
      question: 'Name one official community channel.',
      answer: primaryCommunity,
      description: 'Answer with a community channel (e.g. Discord).',
      xp_reward: quizXp[2] ?? rewards.quiz,
      order_index: 2
    }
  ];

  return [...tasks, ...quizTasks];
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body: any = {};
  try {
    body = await parseBody(req);
  } catch {
    res.status(400).json({ error: 'Invalid JSON body.' });
    return;
  }

  const urls: string[] = Array.isArray(body?.urls) ? body.urls : (body?.url ? [body.url] : []);
  if (!urls.length) {
    res.status(400).json({ error: 'Missing urls.' });
    return;
  }

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Server misconfigured.' });
    return;
  }

  const results: any[] = [];

  for (const rawUrl of urls) {
    try {
      const projectUrl = normalizeUrl(rawUrl);
      const urlObj = new URL(projectUrl);
      const hostname = urlObj.hostname.replace(/^www\./, '');
      const origin = urlObj.origin;

      let html = await fetchHtmlWithRetry(projectUrl);
      let source: 'html' | 'jina' = 'html';
      if (!html) {
        html = await fetchHtmlWithPlaywright(projectUrl);
      }
      if (!html) {
        const jinaText = await fetchHtmlViaJina(projectUrl);
        if (jinaText) {
          html = jinaText;
          source = 'jina';
        }
      }
      if (!html) {
        results.push({ url: rawUrl, error: 'Failed to fetch HTML (bot protection or network error)' });
        continue;
      }

      const rawTitle = source === 'jina'
        ? (parseJinaTitle(html) || hostname)
        : (extractTitle(html) || extractH1(html) || hostname);
      let title = cleanTitle(rawTitle) || hostname;
      const rawH1 = source === 'jina' ? null : extractH1(html);
      const metaDescription = source === 'jina'
        ? cleanJinaDescription(html, title)
        : (extractMetaContent(html, 'description')
          || extractMetaContent(html, 'og:description')
          || extractMetaContent(html, 'twitter:description'));
      const metaKeywords = source === 'jina' ? null : extractMetaContent(html, 'keywords');
      const themeColor = source === 'jina' ? null : extractMetaContent(html, 'theme-color');

      const ogImage = source === 'jina'
        ? null
        : (extractMetaContent(html, 'og:image') ||
          extractMetaContent(html, 'twitter:image') ||
          extractMetaContent(html, 'twitter:image:src'));
      const ogResolved = ogImage
        ? resolveUrl(ogImage.startsWith('//') ? `https:${ogImage}` : ogImage, projectUrl)
        : null;

      const icon = source === 'jina'
        ? null
        : (extractIconHref(html, 'apple-touch-icon') ||
          extractIconHref(html, 'apple-touch-icon-precomposed') ||
          extractIconHref(html, 'icon') ||
          extractIconHref(html, 'shortcut icon') ||
          extractIconHref(html, 'mask-icon'));
      const iconResolved = resolveUrl(icon, projectUrl) || getFaviconUrl(projectUrl);

      const aiRewrite = await rewriteSeoCopyWithAi({
        domain: hostname,
        rawTitle,
        cleanedTitle: title,
        h1: rawH1,
        metaDescription,
        metaKeywords
      });
      if (aiRewrite?.title) {
        title = cleanTitle(aiRewrite.title) || title;
      }

      const links = source === 'jina' ? extractLinksFromText(html) : extractLinks(html, projectUrl);
      const brandTokens = Array.from(new Set([
        ...title.toLowerCase().split(/\s+/),
        hostname.split('.')[0]?.toLowerCase()
      ].filter(Boolean)));
      let socials = extractSocials(links, brandTokens);
      if (Object.keys(socials).length === 0 && source !== 'jina') {
        const jinaText = await fetchHtmlViaJina(projectUrl);
        if (jinaText) {
          const fallbackLinks = extractLinksFromText(jinaText);
          socials = extractSocials(fallbackLinks, brandTokens);
        }
      }
      const sitemapUrls = await collectSiteUrls(origin);

      const description = aiRewrite?.description
        ? clampDescription(normalizeSeoText(aiRewrite.description), AI_DESCRIPTION_MAX)
        : buildSeoDescription(title, hostname, metaDescription, metaKeywords);
      const bannerUrl = ogResolved || iconResolved || getFaviconUrl(projectUrl);
      const logoUrl = iconResolved || getFaviconUrl(projectUrl);

      const projectPayload: Record<string, any> = {
        name: title,
        domain: hostname,
        description,
        social_links: Object.keys(socials).length ? socials : null,
        accent_color: themeColor || '#6366f1',
        position: 'bottom-right',
        theme: 'sleek',
        logo_url: logoUrl,
        banner_url: bannerUrl
      };

      let projectId: string | null = null;
      const { data: existingByDomain } = await supabase
        .from('projects')
        .select('id')
        .eq('domain', hostname)
        .limit(1);
      if (existingByDomain?.[0]?.id) {
        projectId = existingByDomain[0].id;
      }

      if (projectId) {
        const { error: updateError } = await supabase
          .from('projects')
          .update(projectPayload)
          .eq('id', projectId);
        if (updateError) throw updateError;
      } else {
        const { data: created, error: createError } = await supabase
          .from('projects')
          .insert(projectPayload)
          .select('id')
          .single();
        if (createError) throw createError;
        projectId = created.id;
      }

      const seoScore = computeSeoScore({
        description,
        ogImage: ogResolved,
        logoUrl,
        socials,
        sitemapUrls,
        title,
        hostname
      });
      const tasks = buildTasks(projectUrl, title, hostname, socials, sitemapUrls, seoScore);

      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('project_id', projectId);
      if (deleteError) throw deleteError;

      if (tasks.length > 0) {
        const { error: insertError } = await supabase
          .from('tasks')
          .insert(tasks.map((task) => ({
            project_id: projectId,
            title: task.title,
            description: task.description,
            link: task.link ?? null,
            icon_url: task.icon_url ?? null,
            xp_reward: task.xp_reward,
            order_index: task.order_index,
            task_section: task.task_section,
            task_kind: task.task_kind,
            question: task.question ?? null,
            answer: task.answer ?? null
          })));
        if (insertError) throw insertError;
      }

      results.push({
        url: projectUrl,
        projectId,
        name: title,
        domain: hostname,
        seo_score: seoScore,
        socials: Object.keys(socials),
        tasks: tasks.length
      });
    } catch (error: any) {
      results.push({ url: rawUrl, error: error?.message || 'Failed to ingest' });
    }
  }

  res.status(200).json({ results });
}
