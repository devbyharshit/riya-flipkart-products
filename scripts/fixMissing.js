import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
    const dataPath = path.resolve('src/data.js');
    let content = fs.readFileSync(dataPath, 'utf-8');

    // Pattern to find missing items
    const regex = /\["([^"]+)",(\d+),"([^"]+)","(https:\/\/rukminim1\.flixcart\.com\/www\/300\/300\/promos\/04\/07\/2018\/046495cc-c0f7-46dd-99ef-a63f8833e4c8\.png)"\]/g;
    
    let matches;
    const missing = [];
    while ((matches = regex.exec(content)) !== null) {
        missing.push(matches[1]);
    }

    console.log(`Found ${missing.length} missing images.`);
    if (missing.length === 0) return;

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
    });

    for (const id of missing) {
        console.log(`Fetching image for ${id}...`);
        const url = `https://www.flipkart.com/product/p/itm?pid=${id}`;
        
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // Wait for images to appear
            await page.waitForSelector('img[src*="rukminim"]', { timeout: 10000 });
            
            const imgUrl = await page.evaluate(() => {
                const imgs = Array.from(document.querySelectorAll('img[src*="rukminim"]'));
                for (const img of imgs) {
                    const src = img.src;
                    // Product images usually have /image/ in the path
                    if (src.includes('/image/') && !src.includes('promos')) {
                        return src;
                    }
                }
                return null;
            });

            if (imgUrl) {
                // Normalize URL to 300/300
                const normalizedUrl = imgUrl.replace(/\/image\/\d+\/\d+\//, '/image/300/300/');
                console.log(`Found: ${normalizedUrl}`);
                
                const lineRegex = new RegExp(`\\["${id}",(\\d+),"([^"]+)","https:\\/\\/rukminim1\\.flixcart\\.com\\/www\\/300\\/300\\/promos\\/04\\/07\\/2018\\/046495cc-c0f7-46dd-99ef-a63f8833e4c8\\.png"\\]`);
                content = content.replace(lineRegex, `["${id}",$1,"$2","${normalizedUrl}"]`);
            } else {
                console.log(`Failed to find product image for ${id}`);
            }
        } catch (e) {
            console.log(`Error on ${id}: ${e.message}`);
        }
        
        // Slight delay to avoid aggressive rate limiting
        await page.waitForTimeout(1000);
    }

    await browser.close();
    
    fs.writeFileSync(dataPath, content, 'utf-8');
    console.log("Done rewriting src/data.js");
})();
