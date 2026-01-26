export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Ensure URL is valid and has protocol
  let targetUrl = url;
  if (!targetUrl.startsWith('http')) {
    targetUrl = `https://${targetUrl}`;
  }

  try {
    const response = await fetch(targetUrl);
    const html = await response.text();

    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const findMetaContent = (keys: string[]) => {
      for (const key of keys) {
        const escaped = escapeRegExp(key);
        const direct = html.match(new RegExp(`<meta\\s+[^>]*(?:property|name)=[\"']${escaped}[\"'][^>]*content=[\"']([^\"']+)[\"']`, 'i'));
        const reverse = html.match(new RegExp(`<meta\\s+[^>]*content=[\"']([^\"']+)[\"'][^>]*(?:property|name)=[\"']${escaped}[\"']`, 'i'));
        const match = direct || reverse;
        if (match?.[1]) return match[1];
      }
      return null;
    };

    // Images
    let image = findMetaContent(['og:image', 'twitter:image']);
    if (!image) {
      const linkImageMatch = html.match(/<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/i);
      image = linkImageMatch?.[1] ?? null;
    }

    if (image) {
      if (!image.startsWith('http') && !image.startsWith('//')) {
        try {
          image = new URL(image, targetUrl).toString();
        } catch (e) {
          image = null;
        }
      } else if (image.startsWith('//')) {
        image = `https:${image}`;
      }
    }

    // Description
    const description = findMetaContent(['description', 'og:description', 'twitter:description']);

    // Social links
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
    const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html))) {
      const href = linkMatch?.[1];
      if (!href || href.startsWith('mailto:') || href.startsWith('javascript:')) continue;
      let absolute: string;
      try {
        absolute = new URL(href, targetUrl).toString();
      } catch {
        continue;
      }
      let host = '';
      try {
        host = new URL(absolute).hostname.replace(/^www\./, '');
      } catch {
        continue;
      }
      for (const rule of socialRules) {
        if (socials[rule.key]) continue;
        const matched = rule.hosts.some((domain) => host === domain || host.endsWith(`.${domain}`));
        if (matched) {
          socials[rule.key] = absolute;
          break;
        }
      }
      if (Object.keys(socials).length >= socialRules.length) break;
    }

    return res.status(200).json({
      image: image || null,
      description: description || null,
      socials
    });
  } catch (error) {
    console.error('Metadata fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch metadata' });
  }
}
