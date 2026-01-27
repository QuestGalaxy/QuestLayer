import { createClient } from '@supabase/supabase-js';

const isBot = (ua: string) => {
  const value = (ua || '').toLowerCase();
  return /(bot|crawler|spider|crawling|lighthouse|pagespeed|facebookexternalhit|twitterbot|slurp|duckduckbot|bingbot|yandex|baiduspider|telegrambot|whatsapp|discordbot|linkedinbot)/i.test(value);
};

const getSupabaseClient = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials.');
  }
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).end('Method not allowed');
  }

  const projectId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).end('Missing project id');
  }

  const ua = req.headers['user-agent'] || '';
  if (!isBot(ua)) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Location', `/browse?projectId=${encodeURIComponent(projectId)}`);
    return res.status(302).end();
  }

  let project: any = null;
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, domain, description, logo_url, banner_url, social_links')
      .eq('id', projectId)
      .single();
    if (error || !data) {
      return res.status(404).end('Project not found');
    }
    project = data;
  } catch {
    return res.status(500).end('Server error');
  }

  const title = project.name || 'QuestLayer Project';
  const description = project.description || `Explore quests and rewards from ${title} on QuestLayer.`;
  const image = project.banner_url || project.logo_url || '';
  const canonical = `/store/${project.id}`;
  const socials = project.social_links ? Object.values(project.social_links).filter(Boolean) : [];

  const meta = `
    <title>${escapeHtml(title)} | QuestLayer</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:title" content="${escapeHtml(title)} | QuestLayer">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${canonical}">
    ${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
    <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
    <meta name="twitter:title" content="${escapeHtml(title)} | QuestLayer">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : ''}
  `;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Project',
    name: title,
    description,
    url: canonical,
    image: image || undefined,
    sameAs: socials.length ? socials : undefined
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${meta}
  <script type="application/ld+json">${escapeHtml(JSON.stringify(schema))}</script>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(description)}</p>
  </main>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).end(html);
}
