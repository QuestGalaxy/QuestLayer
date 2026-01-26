import { createClient } from '@supabase/supabase-js';

const MAX_HTML_SIZE = 500_000;

const parseArgs = () => {
  const args = new Set(process.argv.slice(2));
  const getValue = (flag, fallback) => {
    const entry = process.argv.find(arg => arg.startsWith(`${flag}=`));
    if (!entry) return fallback;
    return entry.split('=')[1];
  };
  return {
    dryRun: args.has('--dry-run'),
    onlyMissing: !args.has('--all'),
    limit: Number(getValue('--limit', '0')) || 0
  };
};

const extractMetaContent = (html, key) => {
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

const resolveUrl = (value, baseUrl) => {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
};

const fetchOgImage = async (domain) => {
  if (!domain) return null;
  let targetUrl = domain.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'QuestLayerPreviewBot/1.0' }
    });
    if (!response.ok) return null;
    const html = (await response.text()).slice(0, MAX_HTML_SIZE);
    const ogImage =
      extractMetaContent(html, 'og:image') ||
      extractMetaContent(html, 'twitter:image') ||
      extractMetaContent(html, 'twitter:image:src');
    return ogImage ? resolveUrl(ogImage, targetUrl) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const getFaviconUrl = (link) => {
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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const main = async () => {
  const { dryRun, onlyMissing, limit } = parseArgs();
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  let offset = 0;
  const pageSize = 100;
  let processed = 0;
  let updated = 0;
  let skipped = 0;

  while (true) {
    const rangeStart = offset;
    const rangeEnd = offset + pageSize - 1;
    const { data, error } = await supabase
      .from('projects')
      .select('id, domain, logo_url, banner_url')
      .range(rangeStart, rangeEnd);

    if (error) {
      console.error('Failed to fetch projects:', error);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    for (const project of data) {
      if (limit && processed >= limit) {
        console.log(`Reached limit (${limit}).`);
        return;
      }
      processed += 1;

      if (!project.domain) {
        skipped += 1;
        continue;
      }
      if (onlyMissing && project.logo_url && project.banner_url) {
        skipped += 1;
        continue;
      }

      const nextLogo = project.logo_url || getFaviconUrl(project.domain);
      const nextBanner = project.banner_url || await fetchOgImage(project.domain);
      if (!nextLogo && !nextBanner) {
        skipped += 1;
        continue;
      }

      const payload = {};
      if (nextLogo && !project.logo_url) payload.logo_url = nextLogo;
      if (nextBanner && !project.banner_url) payload.banner_url = nextBanner;

      if (Object.keys(payload).length === 0) {
        skipped += 1;
        continue;
      }

      if (dryRun) {
        console.log(`[dry-run] update ${project.id}:`, payload);
      } else {
        const { error: updateError } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', project.id);
        if (updateError) {
          console.error(`Update failed for ${project.id}:`, updateError);
        } else {
          updated += 1;
        }
      }

      await sleep(150);
    }

    offset += data.length;
  }

  console.log(`Done. processed=${processed} updated=${updated} skipped=${skipped} dryRun=${dryRun}`);
};

main();
