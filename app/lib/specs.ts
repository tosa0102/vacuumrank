// app/lib/specs.ts
// Server-only: hämtar specifikationer automatiskt.
// Prioritet: (1) tillverkare (whitelist) -> (2) sekundära källor (vita-listade retailers)
// Ingen fallback till data.json. Om inget hittas: fält lämnas tomt (UI visar "–").

import "server-only";
import { getBrandDomains, SECONDARY_SOURCES } from "./spec-sources";

export type ProductInput = { brand?: string; model?: string; name?: string };

export type ManufacturerSpecs = {
  sourceUrl?: string;
  sourceDomain?: string;
  base?: string;
  navigation?: string;
  suction?: string; // redan formaterad, t.ex. "8000 Pa"
  mopType?: string;
};

// ---------- utils ----------
function norm(s?: string) { return (s ?? "").trim(); }
function hostname(u?: string) {
  try { return u ? new URL(u).hostname.toLowerCase() : undefined; } catch { return undefined; }
}
function uniq<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }
function tryNumber(s?: string): number | undefined {
  if (!s) return;
  const n = Number(String(s).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}
function withPaUnit(val?: string): string | undefined {
  if (!val) return undefined;
  // normalisera "pa" -> "Pa", och lägg till Pa om rent numeriskt
  if (/\bpa\b/i.test(val)) return val.replace(/\bpa\b/i, "Pa");
  const n = tryNumber(val);
  return n ? `${n} Pa` : val;
}

// JSON-LD parsing helpers
function pickFromAdditionalProps(props: any[] | undefined, keys: string[]): string | undefined {
  if (!Array.isArray(props)) return;
  for (const key of keys) {
    const k = key.toLowerCase();
    const hit = props.find((p) => norm(p?.name).toLowerCase().includes(k));
    const v = norm(hit?.value ?? hit?.valueReference ?? hit?.description);
    if (v) return v;
  }
}

function extractFromJsonLdBlock(json: any): Partial<ManufacturerSpecs> {
  const bag: any[] = Array.isArray(json?.["@graph"]) ? json["@graph"] : [json];
  const product = bag.find((n) => {
    const types = Array.isArray(n?.["@type"]) ? n["@type"] : [n?.["@type"]];
    return types.some((t: string) => String(t).toLowerCase() === "product");
  }) ?? json;

  const addl = product?.additionalProperty ?? product?.additionalProperties;
  const base = pickFromAdditionalProps(addl, ["dock", "base", "station", "charging dock"]);
  const navigation = pickFromAdditionalProps(addl, ["navigation", "lidar", "laser", "mapping", "camera", "vslam"]);
  const suction = pickFromAdditionalProps(addl, ["suction", "suction power", "pa"]);
  const mopType = pickFromAdditionalProps(addl, ["mop", "mopping", "mop type", "pad", "spin"]);

  return {
    base: norm(base),
    navigation: norm(navigation),
    suction: withPaUnit(norm(suction)),
    mopType: norm(mopType),
  };
}

function extractFromHtmlTables(html: string): Partial<ManufacturerSpecs> {
  // enkel heuristik: <th>/<td> eller <dt>/<dd>
  const lower = html.toLowerCase();

  function findValueFor(keys: string[]): string | undefined {
    for (const k of keys) {
      const key = k.toLowerCase();
      // <th>key</th><td>value</td>
      let pos = 0;
      while ((pos = lower.indexOf(`<th`, pos)) !== -1) {
        const thClose = lower.indexOf("</th>", pos);
        if (thClose === -1) break;
        const thText = lower.slice(pos, thClose).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        pos = thClose + 5;
        if (thText.includes(key)) {
          const tdStart = lower.indexOf("<td", thClose);
          const tdEnd = tdStart !== -1 ? lower.indexOf("</td>", tdStart) : -1;
          if (tdStart !== -1 && tdEnd !== -1) {
            const frag = html.slice(tdStart, tdEnd);
            const txt = frag.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            if (txt) return txt;
          }
        }
      }
      // <dt>key</dt><dd>value</dd>
      pos = 0;
      while ((pos = lower.indexOf(`<dt`, pos)) !== -1) {
        const dtClose = lower.indexOf("</dt>", pos);
        if (dtClose === -1) break;
        const dtText = lower.slice(pos, dtClose).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        pos = dtClose + 5;
        if (dtText.includes(key)) {
          const ddStart = lower.indexOf("<dd", dtClose);
          const ddEnd = ddStart !== -1 ? lower.indexOf("</dd>", ddStart) : -1;
          if (ddStart !== -1 && ddEnd !== -1) {
            const frag = html.slice(ddStart, ddEnd);
            const txt = frag.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            if (txt) return txt;
          }
        }
      }
    }
  }

  const base = findValueFor(["dock", "charging dock", "base", "station"]);
  const navigation = findValueFor(["navigation", "mapping", "lidar", "laser", "camera"]);
  const suction = findValueFor(["suction", "suction power"]);
  const mopType = findValueFor(["mop", "mopping", "mop type"]);

  return {
    base: norm(base),
    navigation: norm(navigation),
    suction: withPaUnit(norm(suction)),
    mopType: norm(mopType),
  };
}

async function fetchJsonLdBlocks(html: string): Promise<any[]> {
  const blocks: any[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = m[1]?.trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // vissa sajter har flera JSON-objekt i en och samma <script>; ignorera fel
    }
  }
  return blocks;
}

// ---- SerpAPI discovery ----
async function searchSerp(query: string, siteDomain?: string): Promise<string | undefined> {
  if (!process.env.SERPAPI_KEY) return undefined;
  let q = query;
  if (siteDomain) q += ` site:${siteDomain}`;
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&num=10&hl=en&gl=uk&api_key=${process.env.SERPAPI_KEY}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return undefined;
  const data: any = await res.json();
  const items: any[] = data?.organic_results ?? [];
  const first = items.find((r) => r?.link && hostname(r.link)?.includes(siteDomain ?? "")) ?? items[0];
  return first?.link;
}

// ---- public: hämta specs med tvåstegs-fallback ----
export async function fetchProductSpecs(p: ProductInput): Promise<ManufacturerSpecs | undefined> {
  const baseQuery =
    (p.brand && p.model) ? `${p.brand} ${p.model}` :
    (p.brand && p.name) ? `${p.brand} ${p.name}` :
    p.name ?? "";

  if (!baseQuery) return undefined;

  // 1) Tillverkare (whitelist)
  const domains = uniq(getBrandDomains(p.brand));
  for (const d of domains) {
    const url = await searchSerp(baseQuery, d);
    if (!url) continue;
    const htmlRes = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (RankPilot bot for product spec aggregation)" },
      next: { revalidate: 86400 },
    });
    if (!htmlRes.ok) continue;
    const html = await htmlRes.text();

    let out: Partial<ManufacturerSpecs> = {};
    const blocks = await fetchJsonLdBlocks(html);
    for (const b of blocks) out = { ...extractFromJsonLdBlock(b), ...out };
    out = { ...extractFromHtmlTables(html), ...out };

    if (out.base || out.navigation || out.suction || out.mopType) {
      return {
        sourceUrl: url,
        sourceDomain: hostname(url),
        base: out.base,
        navigation: out.navigation,
        suction: out.suction,
        mopType: out.mopType,
      };
    }
    // annars fortsätt till nästa domän
  }

  // 2) Sekundära källor (vita-listade retailers/datablad)
  for (const d of SECONDARY_SOURCES) {
    const url = await searchSerp(baseQuery, d);
    if (!url) continue;
    const htmlRes = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (RankPilot bot for product spec aggregation)" },
      next: { revalidate: 86400 },
    });
    if (!htmlRes.ok) continue;
    const html = await htmlRes.text();

    let out: Partial<ManufacturerSpecs> = {};
    const blocks = await fetchJsonLdBlocks(html);
    for (const b of blocks) out = { ...extractFromJsonLdBlock(b), ...out };
    out = { ...extractFromHtmlTables(html), ...out };

    if (out.base || out.navigation || out.suction || out.mopType) {
      return {
        sourceUrl: url,
        sourceDomain: hostname(url),
        base: out.base,
        navigation: out.navigation,
        suction: out.suction,
        mopType: out.mopType,
      };
    }
  }

  // 3) Inget funnet — lämna undefined (UI visar "–")
  return undefined;
}
