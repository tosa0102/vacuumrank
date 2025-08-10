// Node 18+ (fetch finns globalt)
import fs from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.SERPAPI_KEY;
if (!API_KEY) {
  console.error("Missing SERPAPI_KEY env var.");
  process.exit(1);
}

const dataFiles = [
  "data/uk-premium.json",
  "data/uk-performance.json",
  "data/uk-budget.json",
];

// Domäner vi föredrar (tillverkare & stora UK-återförsäljare/CDNs)
const preferHosts = [
  "roborock.com",
  "dreame-tech.com", "dreame.com",
  "ecovacs.com",
  "eufylife.com", "anker.com",
  "tapo.com", "tp-link.com",
  "m.media-amazon.com", "images-na.ssl-images-amazon.com",
  "currys.co.uk", "media.currys.biz", "currys-ssl.cdn.dixons.com",
  "argos.co.uk", "media.4rgos.it",
  "ao.com", "media.ao.com",
  "johnlewis.com", "scene7.com",
  "very.co.uk", "richersounds.com"
];

function host(u) { try { return new URL(u).hostname.toLowerCase(); } catch { return ""; } }
function preferScore(u) {
  const h = host(u);
  return preferHosts.some(d => h.endsWith(d) || h.includes(d)) ? 500 : 0;
}

function pickBest(images = []) {
  // SerpAPI google_images → images_results med fält: original, width, height, source
  let best = null, score = -1;
  for (const r of images) {
    const url = r.original || r.thumbnail || r.link || "";
    if (!url) continue;
    const s =
      (r.width || 0) + (r.height || 0) +
      preferScore(url) +
      (/jpe?g$/i.test(url) ? 50 : 0);
    if (s > score) { score = s; best = url; }
  }
  return best;
}

async function searchImageUrl(query) {
  const endpoint = "https://serpapi.com/search.json";
  const params = new URLSearchParams({
    engine: "google_images",
    google_domain: "google.co.uk",
    q: query,
    hl: "en",
    gl: "uk",
    num: "10",
    api_key: API_KEY
  });
  const res = await fetch(`${endpoint}?${params.toString()}`);
  if (!res.ok) throw new Error(`SerpAPI ${res.status}`);
  const json = await res.json();
  return pickBest(json.images_results || []);
}

function nameOf(p) {
  return p?.name || [p?.brand, p?.model].filter(Boolean).join(" ");
}

async function processFile(file) {
  const raw = await fs.readFile(file, "utf-8");
  const arr = JSON.parse(raw);
  let changed = false;

  for (const p of arr) {
    if (p.image && typeof p.image === "string" && p.image.startsWith("http")) continue;
    const q = `${nameOf(p)} product photo`;
    try {
      const url = await searchImageUrl(q);
      if (url) {
        p.image = url; // vi hotlinkar
        changed = true;
        console.log("✔", nameOf(p), "→", url);
      } else {
        console.log("— no image:", nameOf(p));
      }
    } catch (e) {
      console.log("✘", nameOf(p), String(e.message || e));
    }
  }

  if (changed) await fs.writeFile(file, JSON.stringify(arr, null, 2), "utf-8");
}

(async () => {
  for (const f of dataFiles) await processFile(f);
  console.log("Done.");
})();
