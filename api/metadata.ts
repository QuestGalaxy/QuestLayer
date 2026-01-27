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

    // Title
    const title = findMetaContent(['og:title', 'twitter:title'])
      || (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null)
      || findMetaContent(['og:site_name']);

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
    const addSocialFromUrl = (href: string) => {
      if (!href || href.startsWith('mailto:') || href.startsWith('javascript:')) return;
      let absolute: string;
      try {
        absolute = new URL(href, targetUrl).toString();
      } catch {
        return;
      }
      let host = '';
      try {
        host = new URL(absolute).hostname.replace(/^www\./, '');
      } catch {
        return;
      }
      for (const rule of socialRules) {
        if (socials[rule.key]) continue;
        const matched = rule.hosts.some((domain) => host === domain || host.endsWith(`.${domain}`));
        if (matched) {
          socials[rule.key] = absolute;
          break;
        }
      }
    };
    while ((linkMatch = linkRegex.exec(html))) {
      addSocialFromUrl(linkMatch?.[1] || '');
      if (Object.keys(socials).length >= socialRules.length) break;
    }

    // Fallback: use Jina AI reader for JS-heavy pages if we didn't find socials.
    if (Object.keys(socials).length === 0) {
      try {
        const jinaUrl = `https://r.jina.ai/http://${targetUrl.replace(/^https?:\/\//i, '')}`;
        const jinaRes = await fetch(jinaUrl);
        if (jinaRes.ok) {
          const jinaText = await jinaRes.text();
          const urlRegex = /(https?:\/\/[^\s"'<>]+)/g;
          const matches = jinaText.match(urlRegex) || [];
          for (const raw of matches) {
            addSocialFromUrl(raw);
            if (Object.keys(socials).length >= socialRules.length) break;
          }
        }
      } catch {
        // ignore fallback failures
      }
    }

    return res.status(200).json({
      title: title || null,
      image: image || null,
      description: description || null,
      socials
    });
  } catch (error) {
    console.error('Metadata fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch metadata' });
  }
}
