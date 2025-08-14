// app/lib/specs-scraper.ts
// HTML-extraktion (JSON-LD, tabellheuristik, regex-fallback) + SerpAPI-sök
// Nu med "details" (kortare snippets) per fält för 3–4 rader i UI.

import { SPEC_FIELD_MAP } from "./spec-sources";

const TIMEOUT_MS = 2500;
const MAX_LINKS_PER_QUERY = 3;
const UA = "Mozilla/5.0 (RankPilot bot for product spec aggregation)";

type ExtractOut = {
  base?: string;
  navigation?: string;
  suction?: string;
  mopType?: string;

  baseDetails?: string[];
  navigationDetails?: string[];
  suctionDetails?: string[];
  mopTypeDetails?: string[];
};

export type ScrapeResult = ExtractOut & {
  sourceUrl?: string;
  sourceDomain?: string;
};

function norm(s?: string) { return (s ?? "").trim(); }
function lc(s?: string) { return norm(s).toLowerCase(); }
function host(u?: string) { try { return u ? new URL(u).hostname : undefined; } catch { return undefined; } }

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
  if (!process.env.SERPAPI_KEY) return [];
  const q = `${query} (specifications OR specs OR features)`;
  const url = `https://serpapi.com/search.json?engine=google&hl=en&gl=uk&num=10&q=${encodeURIComponent(q)}&api_key=${process.env.SERPAPI_KEY}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.organic_results ?? [];
    return items.map((x: any) => x?.link).filter(Boolean).slice(0, MAX_LINKS_PER_QUERY);
  } catch { return []; }
}

async function fetchHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      headers: { "user-agent": UA },
    });
    if (!res.ok) return "";
    return await res.text();
  } catch { return ""; }
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

function snippetsAround(text: string, keys: string[], max = 3): string[] {
  // extrahera 4–7 ord runt nyckelträffar (kort och slagkraftigt)
  const out: string[] = [];
  const clean = text.replace(/\s+/g, " ").trim();
  const words = clean.split(" ");
  const lcJoin = clean.toLowerCase();

  for (const k of keys.map((x) => x.toLowerCase())) {
    let idx = lcJoin.indexOf(k);
    let safety = 0;
    while (idx !== -1 && out.length < max && safety < 20) {
      // hitta ordindex ungefär där matchen börjar
      const leftStr = clean.slice(0, idx);
      const leftCount = leftStr ? leftStr.split(" ").length : 0;
      const start = Math.max(0, leftCount - 4);
      const end = Math.min(words.length, leftCount + Math.ceil(k.split(" ").length) + 3);
      const snippet = words.slice(start, end).join(" ");
      const trimmed = snippet.replace(/[.,;:()\[\]{}]+$/g, "");
      if (trimmed && !out.includes(trimmed)) out.push(trimmed);
      idx = lcJoin.indexOf(k, idx + k.length);
      safety++;
    }
    if (out.length >= max) break;
  }
  return out.slice(0, max);
}

function extractFromJsonLd(json: any, fullText?: string): ExtractOut {
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

  const result: ExtractOut = {
    base: norm(base),
    navigation: norm(navigation),
    suction: withPa(norm(suction)),
    mopType: norm(mopType),
  };

  if (fullText) {
    result.baseDetails = snippetsAround(fullText, SPEC_FIELD_MAP.base);
    result.navigationDetails = snippetsAround(fullText, SPEC_FIELD_MAP.navigation);
    result.suctionDetails = snippetsAround(fullText, SPEC_FIELD_MAP.suction);
    result.mopTypeDetails = snippetsAround(fullText, SPEC_FIELD_MAP.mopType);
  }
  return result;
}

function stripTags(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ")
             .replace(/<style[\s\S]*?<\/style>/gi, " ")
             .replace(/<[^>]+>/g, " ")
             .replace(/\s+/g, " ")
             .trim();
}

function extractFromHtmlTables(html: string): ExtractOut {
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

  const text = stripTags(html);

  return {
    base: norm(base),
    navigation: norm(navigation),
    suction: withPa(norm(suction)),
    mopType: norm(mopType),
    baseDetails: snippetsAround(text, SPEC_FIELD_MAP.base),
    navigationDetails: snippetsAround(text, SPEC_FIELD_MAP.navigation),
    suctionDetails: snippetsAround(text, SPEC_FIELD_MAP.suction),
    mopTypeDetails: snippetsAround(text, SPEC_FIELD_MAP.mopType),
  };
}

function extractByRegex(html: string): ExtractOut {
  const text = stripTags(html);
  const mSuction = text.match(/(\d{3,5})\s*pa\b/i);
  const nav = /lidar|laser|vslam|camera|gyro/i.exec(text)?.[0];
  const mop = /dual\s+spinn?ing|sonic|vibra(?:-?rise)?|vibra-?mop|oscillat(?:ing|ion)|pad\b|mop\s+wash\/?dry/i.exec(text)?.[0];
  const base = /self-?empty|auto(?:matic)?\s*empty(?:ing)?|charging\s+dock|clean(?:ing)?\s*(?:and\s*)?dry(?:ing)?\s*station|wash\/?dry\s*station/i.exec(text)?.[0];

  return {
    base,
    navigation: nav,
    suction: withPa(mSuction?.[0]),
    mopType: mop,
    baseDetails: snippetsAround(text, SPEC_FIELD_MAP.base),
    navigationDetails: snippetsAround(text, SPEC_FIELD_MAP.navigation),
    suctionDetails: snippetsAround(text, SPEC_FIELD_MAP.suction),
    mopTypeDetails: snippetsAround(text, SPEC_FIELD_MAP.mopType),
  };
}

async function tryExtractFromUrl(url: string): Promise<ScrapeResult | undefined> {
  const html = await fetchHtml(url);
  if (!html) return undefined;

  const text = stripTags(html);
  const out: ScrapeResult = { sourceUrl: url, sourceDomain: host(url) };

  // 1) JSON-LD
  const blocks = await extractJsonLd(html);
  for (const b of blocks) {
    const part = extractFromJsonLd(b, text);
    for (const [k, v] of Object.entries(part)) if ((out as any)[k] == null && v) (out as any)[k] = v as any;
  }

  // 2) Tabeller
  const fromHtml = extractFromHtmlTables(html);
  for (const [k, v] of Object.entries(fromHtml)) if ((out as any)[k] == null && v) (out as any)[k] = v as any;

  // 3) Regex
  const byRegex = extractByRegex(html);
  for (const [k, v] of Object.entries(byRegex)) if ((out as any)[k] == null && v) (out as any)[k] = v as any;

  if (out.base || out.navigation || out.suction || out.mopType) return out;
  return undefined;
}

export async function searchAndExtractSpecs({
  queries,
  hintUrls = [],
}: {
  queries: string[];
  hintUrls?: string[];
}): Promise<ScrapeResult> {
  // 0) Försök först med hint-URLs
  for (const u of hintUrls) {
    const r = await tryExtractFromUrl(u);
    if (r) return r;
  }

  // 1) Annars sök via SerpAPI
  for (const q of queries) {
    const links = await serpApiSearch(q);
    for (const link of links) {
      const r = await tryExtractFromUrl(link);
      if (r) return r;
    }
  }
  return {};
}
