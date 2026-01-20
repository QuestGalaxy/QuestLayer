const MAX_HTML_SIZE = 500_000;

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

const resolveUrl = (value: string, baseUrl: string) => {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
};

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const urlParam = Array.isArray(req.query?.url) ? req.query.url[0] : req.query?.url;
  if (!urlParam || typeof urlParam !== 'string') {
    res.status(400).json({ error: 'Missing url' });
    return;
  }

  let targetUrl = urlParam.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'QuestLayerPreviewBot/1.0'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(200).json({ image: null });
      return;
    }

    const html = (await response.text()).slice(0, MAX_HTML_SIZE);
    const ogImage =
      extractMetaContent(html, 'og:image') ||
      extractMetaContent(html, 'twitter:image') ||
      extractMetaContent(html, 'twitter:image:src');

    const resolved = ogImage ? resolveUrl(ogImage, targetUrl) : null;

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.status(200).json({ image: resolved });
  } catch {
    res.status(200).json({ image: null });
  }
}
