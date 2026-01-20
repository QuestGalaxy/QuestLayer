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

    // Regex for og:image, twitter:image, or link rel="image_src"
    // Handling different attribute orders and quotes
    const ogImageMatch = html.match(/<meta\s+[^>]*(?:property|name)=["']og:image["'][^>]*content=["']([^"']+)["']/i) || 
                         html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image["']/i);
    
    const twitterImageMatch = html.match(/<meta\s+[^>]*(?:property|name)=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                              html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']twitter:image["']/i);
                              
    const linkImageMatch = html.match(/<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/i);

    let image = ogImageMatch?.[1] || twitterImageMatch?.[1] || linkImageMatch?.[1];

    if (image) {
       // Handle relative URLs
       if (!image.startsWith('http') && !image.startsWith('//')) {
         try {
           image = new URL(image, targetUrl).toString();
         } catch (e) {
           // If URL construction fails, leave it or nullify
         }
       } else if (image.startsWith('//')) {
          image = `https:${image}`;
       }
       return res.status(200).json({ image });
    } else {
       return res.status(404).json({ error: 'No image found' });
    }
  } catch (error) {
    console.error('Metadata fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch metadata' });
  }
}
