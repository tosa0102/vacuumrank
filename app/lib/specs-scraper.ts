// app/lib/specs-scraper.ts
// SerpAPI-sök + HTML-extraktion (JSON-LD, tabellheuristik, regex-fallback)
// Med hårda tidsgränser och länkbegränsning.

import { SPEC_FIELD_MAP } from "./spec-sources";

const TIMEOUT_MS = 2500;              // hård timeout per nätverksanrop
const MAX_LINKS_PER_QUERY = 3;        // försök bara på topp-länkar
const UA = "Mozilla/5.0 (RankPilot bot for product spec aggregation)";

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

function withTimeout(p: Promise<Response>, ms = TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return p.finally(() => clearTimeout(t)).catch(() => { throw new Error("timeout"); });
}

async function serpApiSearch(query: string): Promise<string[]> {
  if (!process.env.SERPAPI_KEY) {
    console.warn("[specs-scraper] SERPAPI_KEY saknas");
    return [];
  }
  const q = `${query} (specifications OR specs OR features)`;
  const url = `https://serpapi.com/search.json?engine=google&hl=en&gl=uk&num=10&q=${encodeURIComponent(q)}&api_key=${process.env.SERPAPI_KEY}`;
  try {
    const res = await withTimeout(fetch(url, { cache: "no-store" }));
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.organic_results ?? [];
    return items.map((x: any) => x?.link).filter(Boolean).slice(0, MAX_LINKS_PER_QUERY);
  } catch {
    return [];
  }
}

async function fetchHtml(url: string): Promise<string> {
  try {
    const res = await withTimeout(fetch(url, {
      cache: "no-store",            // undvik Response.clone-problemet
      redirect: "follow",
      headers: { "user-agent": UA },
    }));
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

async function extractJsonLd(html: string): Promise<any[]> {
  const blocks: any[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = m[1]?.trim();
    if (!raw) continue;
    try { blocks.push(JSON.parse(raw)); } catch { /* ignore */ }
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
    // <th>nyckel</th><td>värde</td> och <dt>nyckel</dt><dd>värde</dd>
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

// Regex-fallback i hela dokumentet
function extractByRegex(html: string) {
  const text = html.replace(/\s+/g, " ");
  const mSuction = text.match(/(\d{3,5})\s*pa\b/i);
  const nav = /lidar|laser|vslam|camera|gyro/i.exec(text)?.[0];
  const mop = /dual\s+spinn?ing|sonic|vibra(?:-?rise)?|vibra-?mop|oscillat(?:ing|ion)|pad\b|mop\s+wash\/?dry/i.exec(text)?.[0];
  const base = /self-?empty|auto(?:matic)?\s*empty(?:ing)?|charging\s+dock|clean(?:ing)?\s*(?:and\s*)?dry(?:ing)?\s*station|wash\/?dry\s*station/i.exec(text)?.[0];

  return {
    base: base,
    navigation: nav,
    suction: withPa(mSuction?.[0]),
    mopType: mop,
  };
}

export async function searchAndExtractSpecs({ queries }: { queries: string[] }): Promise<Record<string, string | undefined>> {
  const out: Record<string, string | undefined> = {};
  for (const q of queries) {
    const links = await serpApiSearch(q);
    for (const link of links) {
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

      // 3) Regex-fallback
      const byRegex = extractByRegex(html);
      out.base = out.base ?? byRegex.base;
      out.navigation = out.navigation ?? byRegex.navigation;
      out.suction = out.suction ?? byRegex.suction;
      out.mopType = out.mopType ?? byRegex.mopType;

      if (out.base || out.navigation || out.suction || out.mopType) return out;
    }
  }
  return out;
}
