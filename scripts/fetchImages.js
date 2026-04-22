import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data.js');

// Parse data.js
let rawDataJs = fs.readFileSync(dataFilePath, 'utf8');

// The file looks like:
// const RAW = [
// ["id", price, "cat"],
// ...
// ];
// export default RAW;

// We will use eval or JSON.parse after some formatting to read it.
const arrayMatch = rawDataJs.match(/const RAW = (\[[\s\S]*?\]);/);
if (!arrayMatch) {
  console.error("Could not parse data.js");
  process.exit(1);
}

let products = eval(arrayMatch[1]);

async function fetchImage(id) {
  try {
    const bodyStr = JSON.stringify({ pageUri: `/p/itm?pid=${id}` });
    const res = await fetch('https://2.rome.api.flipkart.com/api/4/page/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.flipkart.com',
        'Referer': 'https://www.flipkart.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
        'x-user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 FKUA/website/42/website/Desktop',
        'flipkart_secure': 'true'
      },
      body: bodyStr
    });
    
    if (!res.ok) {
        if (res.status === 429 || res.status === 403) {
            console.log(`Rate limited or forbidden for ${id} (Status: ${res.status})`);
            return null;
        }
        return null;
    }

    const html = await res.text();
    
    let imageUrl = '';
    const match = html.match(/https:\/\/rukminim[^\"]*\{\@width\}[^\"]*\.(jpeg|jpg|png|webp)/i);
    if (match) {
      imageUrl = match[0];
    } else {
      const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/i);
      if (ogMatch) imageUrl = ogMatch[1];
    }
    
    if (imageUrl) {
        imageUrl = imageUrl.replace('{@width}', '300')
                           .replace('{@height}', '300')
                           .replace('{@quality}', '70')
                           .replace('{@crop}', 'false');
        return imageUrl;
    }
    
    return null;
  } catch (err) {
    console.error(`Error fetching ${id}:`, err.message);
    return null;
  }
}

async function main() {
  const BATCH_SIZE = 10;
  const DELAY_MS = 200;

  
  let updatedCount = 0;
  let consecutiveErrors = 0;
  
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    
    const promises = batch.map(async (product, batchIdx) => {
      const globalIdx = i + batchIdx;
      
      if (product.length >= 4 && product[3] && product[3] !== "error") {
        return;
      }
      
      const [id] = product;
      const imgUrl = await fetchImage(id);
      
      if (imgUrl) {
        product[3] = imgUrl;
        updatedCount++;
        consecutiveErrors = 0;
        console.log(`[${globalIdx + 1}/${products.length}] Fetched image for ${id}`);
      } else {
        // Mark as error so we don't retry forever in this run, or leave as null?
        // Let's leave it as is, so we can retry on next run.
        console.log(`[${globalIdx + 1}/${products.length}] Failed for ${id}`);
        consecutiveErrors++;
      }
    });
    
    await Promise.all(promises);
    
    if (updatedCount > 0 && i % (BATCH_SIZE * 5) === 0) {
        saveData(products);
    }
    
    if (consecutiveErrors > 15) {
       console.error("Too many consecutive errors, IP probably blocked. Stopping.");
       break;
    }
    
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }
  
  console.log(`Finished. Updated ${updatedCount} products.`);
  saveData(products);
}

function saveData(dataArray) {
    const jsonStr = JSON.stringify(dataArray, null, 0);
    // Format it nicely to match the original layout approximately
    const formatted = "const RAW = [\n" + 
      dataArray.map(item => JSON.stringify(item)).join(",\n") + 
      "\n];\n\nexport default RAW;\n";
      
    fs.writeFileSync(dataFilePath, formatted);
}

main().catch(console.error);
