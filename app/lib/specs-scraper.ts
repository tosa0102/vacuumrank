// app/lib/specs-scraper.ts
// SerpAPI-sök + HTML-extraktion (JSON-LD, tabellheuristik, regex-fallback)
// Fix: cache: "no-store" för att undvika "Response.clone: Body has already been consumed"

import { SPEC_FIELD_MAP } from "./spec-sources";

function norm(s?: string) { return (s ?? "").trim(); }
function lc(s?: string) { return norm(s).toLowerCase(); }

function onlyNumber(s?: string) {
  if (!s) return undefined;
  const n = Number(String(s).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}
function withPa(val?: string) {
  if (!val) return val;
  if (/\bpa\b/i.test(val)) return val.replace(/\bpa\b/i, "Pa");
  const n = onlyNumber(val);
  return n ? `${n} Pa` : val;
}

async function serpApiSearch(query: string): Promise<string[]> {
  if (!process.env.SERPAPI_KEY) {
    console.warn("[specs-scraper] SERPAPI_KEY saknas");
    return [];
  }
  const q = `${query} (specifications OR specs OR features)`;
  const url = `https://serpapi.com/search.json?engine=google&hl=en&gl=uk&num=10&q=${encodeURIComponent(q)}&api_key=${process.env.SERPAPI_KEY}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  const items = data?.organic_results ?? [];
  return items.map((x: any) => x?.link).filter(Boolean);
}

async function fetchHtml(url: string): Promise<string> {
  // Viktigt: no-store + follow, samt UA
  const res = await fetch(url, {
    cache: "no-store",
    redirect: "follow",
    headers: { "user-agent": "Mozilla/5.0 (RankPilot bot for product spec aggregation)" },
  });
  if (!res.ok) return "";
  return await res.text();
}

async function extractJsonLd(html: string): Promise<any[]> {
  const blocks: any[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = m[1]?.trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch { /* ignorera trasiga block */ }
  }
  return blocks;
}

function pickFromAdditionalProps(props: any[] | undefined, keys: string[]): string | undefined {
  if (!Array.isArray(props)) return;
  for (const key of keys) {
    const hit = props.find((p) => lc(p?.name).includes(key));
    const v = norm(hit?.value ?? hit?.valueReference ?? hit?.description);
    if (v) return v;
  }
}

function extractFromJsonLd(json: any) {
  const bag: any[] = Array.isArray(json?.["@graph"]) ? json["@graph"] : [json];
  const product = bag.find((n) => {
    const types = Array.isArray(n?.["@type"]) ? n["@type"] : [n?.["@type"]];
    return types.some((t: string) => lc(t) === "product");
  }) ?? json;

  const addl = product?.additionalProperty ?? product?.additionalProperties;
  const base = pickFromAdditionalProps(addl, SPEC_FIELD_MAP.base.map(lc));
  const navigation = pickFromAdditionalProps(addl, SPEC_FIELD_MAP.navigation.map(lc));
  const suction = pickFromAdditionalProps(addl, SPEC_FIELD_MAP.suction.map(lc));
  const mopType = pickFromAdditionalProps(addl, SPEC_FIELD_MAP.mopType.map(lc));

  return {
    base: norm(base),
    navigation: norm(navigation),
    suction: withPa(norm(suction)),
    mopType: norm(mopType),
  };
}

function extractFromHtmlTables(html: string) {
  const lower = html.toLowerCase();

  function pick(keys: string[]): string | undefined {
    // <th>nyckel</th><td>värde</td>
    for (const key of keys) {
      const k = key.toLowerCase();
      let pos = 0;
      while ((pos = lower.indexOf("<th", pos)) !== -1) {
        const thClose = lower.indexOf("</th>", pos);
        if (thClose === -1) break;
        const thText = lower.slice(pos, thClose).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();
        pos = thClose + 5;
        if (thText.includes(k)) {
          const tdStart = lower.indexOf("<td", thClose);
          const tdEnd = tdStart !== -1 ? lower.indexOf("</td>", tdStart) : -1;
          if (tdStart !== -1 && tdEnd !== -1) {
            const frag = html.slice(tdStart, tdEnd);
            const txt = frag.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            if (txt) return txt;
          }
        }
      }
      // <dt>nyckel</dt><dd>värde</dd>
      pos = 0;
      while ((pos = lower.indexOf("<dt", pos)) !== -1) {
        const dtClose = lower.indexOf("</dt>", pos);
        if (dtClose === -1) break;
        const dtText = lower.slice(pos, dtClose).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();
        pos = dtClose + 5;
        if (dtText.includes(k)) {
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
    return undefined;
  }

  const base = pick(SPEC_FIELD_MAP.base);
  const navigation = pick(SPEC_FIELD_MAP.navigation);
  const suction = pick(SPEC_FIELD_MAP.suction);
  const mopType = pick(SPEC_FIELD_MAP.mopType);

  return {
    base: norm(base),
    navigation: norm(navigation),
    suction: withPa(norm(suction)),
    mopType: norm(mopType),
  };
}

// --- Regex fallback direkt i hela HTML: fångar vanliga skrivsätt ---
function extractByRegex(html: string) {
  const text = html.replace(/\s+/g, " ");
  // suction — leta efter tal + "Pa"
  const mSuction = text.match(/(\d{3,5})\s*pa\b/i);
  // navigation — plocka upp välkända buzzwords
  const nav = /lidar|laser|vslam|camera|gyro/i.exec(text)?.[0];
  // mop type
  const mop =
    /dual\s+spinn?ing|sonic|vibra(?:-?rise)?|vibra-?mop|oscillat(?:ing|ion)|pad\b|mop\s+wash\/?dry/i.exec(text)?.[0];
  // base
  const base =
    /self-?empty|auto(?:matic)?\s*empty(?:ing)?|charging\s+dock|clean(?:ing)?\s*(?:and\s*)?dry(?:ing)?\s*station|wash\/?dry\s*station/i.exec(text)?.[0];

  return {
    base: base && formatBaseLabel(base),
    navigation: nav && formatNavLabel(nav),
    suction: withPa(mSuction?.[0]),
    mopType: mop && formatMopLabel(mop),
  };
}

function formatBaseLabel(s: string) {
  const x = s.toLowerCase();
  const parts: string[] = [];
  if (/self-?empty|auto.*empty/.test(x)) parts.push("Self-empty");
  if (/wash\/?dry|clean.*dry/.test(x)) parts.push("mop wash/dry");
  if (/charging\s+dock/.test(x)) parts.push("Charging dock");
  if (/station/.test(x) && parts.length === 0) parts.push("Base station");
  return parts.join(" + ") || s;
}
function formatNavLabel(s: string) {
  const x = s.toLowerCase();
  if (/lidar|laser/.test(x)) return "Lidar";
  if (/vslam/.test(x)) return "VSLAM";
  if (/camera/.test(x)) return "Camera";
  if (/gyro/.test(x)) return "Gyroscope";
  return s;
}
function formatMopLabel(s: string) {
  const x = s.toLowerCase();
  if (/dual\s+spinn?ing/.test(x)) return "Dual spinning";
  if (/vibra-?mop|vibra(?:-?rise)?|sonic|oscillat/.test(x)) return "Vibra/sonic";
  if (/pad\b/.test(x)) return "Pad";
  if (/wash\/?dry/.test(x)) return "Wash/dry";
  return s;
}

export async function searchAndExtractSpecs({ queries }: { queries: string[] }): Promise<Record<string, string | undefined>> {
  const out: Record<string, string | undefined> = {};
  for (const q of queries) {
    const links = await serpApiSearch(q);
    for (const link of links) {
      try {
        const html = await fetchHtml(link);
        if (!html) continue;

        // 1) JSON-LD
        const blocks = await extractJsonLd(html);
        for (const b of blocks) {
          const part = extractFromJsonLd(b);
          out.base = out.base ?? part.base;
          out.navigation = out.navigation ?? part.navigation;
          out.suction = out.suction ?? part.suction;
          out.mopType = out.mopType ?? part.mopType;
        }

        // 2) HTML-tabeller
        const fromHtml = extractFromHtmlTables(html);
        out.base = out.base ?? fromHtml.base;
        out.navigation = out.navigation ?? fromHtml.navigation;
        out.suction = out.suction ?? fromHtml.suction;
        out.mopType = out.mopType ?? fromHtml.mopType;

        // 3) Regex‑fallback på hela dokumentet
        const byRegex = extractByRegex(html);
        out.base = out.base ?? byRegex.base;
        out.navigation = out.navigation ?? byRegex.navigation;
        out.suction = out.suction ?? byRegex.suction;
        out.mopType = out.mopType ?? byRegex.mopType;

        if (out.base || out.navigation || out.suction || out.mopType) return out;
      } catch (e) {
        console.warn("[specs-scraper] Misslyckades för:", link, e);
      }
    }
  }
  return out;
}
