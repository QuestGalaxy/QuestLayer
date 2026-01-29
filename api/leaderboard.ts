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

  res.setHeader('Vary', 'User-Agent');

  const projectId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).end('Missing project id');
  }

  const ua = req.headers['user-agent'] || '';
  if (!isBot(ua)) {
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    // Redirect humans to the app with query param, which App.tsx will handle and restore URL
    res.setHeader('Location', `/leaderboard?leaderboardId=${encodeURIComponent(projectId)}`);
    return res.status(302).end();
  }

  let project: any = null;
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, logo_url, banner_url')
      .eq('id', projectId)
      .single();
    if (error || !data) {
      return res.status(404).end('Project not found');
    }
    project = data;
  } catch {
    return res.status(500).end('Server error');
  }

  const title = `${project.name} Leaderboard | QuestLayer`;
  const description = project.description 
    ? `Check out the top performers in ${project.name} on QuestLayer. Join the competition and earn rewards!`
    : `Join the competition on the ${project.name} Leaderboard! Earn XP, track your rank, and unlock exclusive daily and weekly rewards.`;
  const image = project.banner_url || project.logo_url || 'https://questlayer.app/leaderboard.jpeg';
  const canonical = `https://questlayer.app/leaderboard/${project.id}`;

  const meta = `
    <title>${escapeHtml(title)}</title>
    <meta name="title" content="${escapeHtml(title)}">
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(image)}">
  `;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: canonical,
    image: image
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
    <img src="${escapeHtml(image)}" alt="${escapeHtml(project.name)}" style="max-width:100%;" />
  </main>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300'); // Cache for performance
  return res.status(200).end(html);
}
