export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const pidMatch = (req.body.pageUri || req.body).match(/pid=([^&]+)/);
    const pid = pidMatch ? pidMatch[1] : '';

    const flipkartRes = await fetch(`https://www.flipkart.com/product/p/itm?pid=${pid}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    const data = await flipkartRes.text();
    
    // We are now fetching the HTML page directly using a Googlebot user agent.
    // Let's extract the image URL from the HTML.
    let imageUrl = '';
    const match = data.match(/https:\/\/rukminim[^\"]*\{\@width\}[^\"]*\.(jpeg|jpg|png|webp)/i);
    if (match) {
        imageUrl = match[0];
    } else {
        // Fallback to og:image if the structured data fails
        const ogMatch = data.match(/property="og:image"\s+content="([^"]+)"/i);
        if (ogMatch) imageUrl = ogMatch[1];
    }

    // Since we are returning the URL directly now, we send it as JSON so the frontend can parse it.
    if (imageUrl && !data.includes('site is overloaded') && flipkartRes.ok) {
      res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
      return res.status(200).json({ url: imageUrl });
    }
    
    return res.status(200).json({ url: null, html: data.substring(0, 500) });
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
