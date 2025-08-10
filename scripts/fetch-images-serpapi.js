import fs from "node:fs/promises";

const API_KEY = process.env.SERPAPI_KEY;
if (!API_KEY) { console.error("Missing SERPAPI_KEY"); process.exit(1); }

const dataFiles = ["data/uk-premium.json","data/uk-performance.json","data/uk-budget.json"];
const preferHosts = [
  "roborock.com","dreame-tech.com","dreame.com","ecovacs.com",
  "eufylife.com","anker.com","tapo.com","tp-link.com",
  "m.media-amazon.com","currys.co.uk","argos.co.uk","ao.com",
  "johnlewis.com","scene7.com","very.co.uk","richersounds.com"
];

const host = u => { try { return new URL(u).hostname.toLowerCase(); } catch { return ""; } };
const score = r => {
  const url = r.original || r.link || r.thumbnail || "";
  const wh = (r.width||0) + (r.height||0);
  const pref = preferHosts.some(d => host(url).includes(d)) ? 500 : 0;
  const jpg = /jpe?g$/i.test(url) ? 50 : 0;
  return [url, wh + pref + jpg];
};

async function searchImageUrl(q){
  const u = new URL("https://serpapi.com/search.json");
  u.search = new URLSearchParams({
    engine: "google_images", google_domain: "google.co.uk",
    q, hl: "en", gl: "uk", num: "20", api_key: API_KEY
  });
  const res = await fetch(u); if(!res.ok) throw new Error(`SerpAPI ${res.status}`);
  const j = await res.json(); const arr = j.images_results || [];
  if(!arr.length) return null;
  let best = null, bestScore = -1;
  for(const r of arr){ const [url, s] = score(r); if(url && s>bestScore){ best=url; bestScore=s; } }
  return best;
}

const nameOf = p => p?.name || [p?.brand, p?.model].filter(Boolean).join(" ");

async function processFile(file){
  const raw = await fs.readFile(file,"utf-8"); const arr = JSON.parse(raw);
  let changed = false;
  for(const p of arr){
    const n = nameOf(p); if(!n) continue;
    if(p.image && typeof p.image==="string" && p.image.startsWith("http")) { console.log("skip", n); continue; }
    const q = `${n} product photo`;
    try{
      console.log("search:", q);
      const url = await searchImageUrl(q);
      if(url){ p.image = url; changed = true; console.log("✔", n, "→", url); }
      else { console.log("— no results", n); }
    }catch(e){ console.log("✘", n, String(e?.message||e)); }
  }
  if(changed) await fs.writeFile(file, JSON.stringify(arr,null,2), "utf-8");
}

(async()=>{ for(const f of dataFiles) await processFile(f); console.log("Done."); })();
