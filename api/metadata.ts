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
    const siteName = findMetaContent(['og:site_name']);
    const rawTitle = findMetaContent(['og:title', 'twitter:title'])
      || (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null)
      || null;
    const normalizeTitle = (value: string | null) => {
      if (!value) return null;
      let trimmed = value.trim();
      if (!trimmed) return null;
      // Prefer first segment if title has separators
      const separators = ['|', '–', '—', '-', '•', '·', ':'];
      for (const sep of separators) {
        if (trimmed.includes(sep)) {
          const [first] = trimmed.split(sep).map((part) => part.trim()).filter(Boolean);
          if (first) trimmed = first;
          break;
        }
      }
      // Remove common marketing fluff
      const stopWords = new Set([
        'the', 'a', 'an', 'to', 'for', 'with', 'and', 'of', 'in', 'on', 'by', 'from',
        'official', 'homepage', 'home', 'welcome', 'site', 'website', 'platform', 'app'
      ]);
      const marketing = new Set([
        'revolutionizing', 'unleash', 'discover', 'explore', 'earn', 'build', 'building',
        'powered', 'ultimate', 'best'
      ]);
      const words = trimmed.split(/\s+/).filter(Boolean);
      const cleaned = words.filter((word, idx) => {
        const lower = word.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!lower) return false;
        if (marketing.has(lower)) return false;
        if (idx > 0 && stopWords.has(lower)) return false;
        return true;
      });
      let finalWords = cleaned.length ? cleaned : words;
      if (finalWords.length > 4) finalWords = finalWords.slice(0, 4);
      return finalWords.join(' ').trim();
    };
    const title = normalizeTitle(siteName) || normalizeTitle(rawTitle);

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
