import fs from 'fs';

const TURNA_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8',
};

async function test() {
  const url = `https://www.turna.com/ucak-bileti/tek-yon/istanbul-sanliurfa-guney-anadolu-havalimani/2026-08-29?adult=1`;
  console.log("Fetching", url);
  const res = await fetch(url, { headers: TURNA_HEADERS });
  console.log("Status:", res.status, res.url);
  const html = await res.text();
  fs.writeFileSync('turna_test2.html', html);
  console.log("Saved to turna_test2.html. Length:", html.length);
}
test();
