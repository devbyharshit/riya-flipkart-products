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
    const flipkartRes = await fetch('https://2.rome.api.flipkart.com/api/4/page/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.flipkart.com',
        'Referer': 'https://www.flipkart.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
        'x-user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 FKUA/website/42/website/Desktop',
        'X-Forwarded-For': `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
      },
      body: JSON.stringify({
        "pageUri": req.body.pageUri || req.body,
        "pageContext": {
          "fetchSeoData": true
        }
      })
    });

    const data = await flipkartRes.text();
    
    // If Flipkart didn't block us with an overloaded error, tell Vercel's CDN to cache this response
    // for 24 hours so it never has to hit the serverless function again for this product!
    if (!data.includes('site is overloaded') && flipkartRes.ok) {
      res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
    }
    
    return res.status(200).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
