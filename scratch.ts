import { scrapeTurnaDirect } from './api/utils/scraper.ts';

async function test() {
  console.log("Scraping Turna for Istanbul -> Şanlıurfa...");
  try {
    const data = await scrapeTurnaDirect("İstanbul", "Şanlıurfa", "ucak", "2026-08-29");
    console.log(`Found ${data.length} flights`);
    if(data.length > 0) {
      console.log(JSON.stringify(data[0], null, 2));
    }
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
