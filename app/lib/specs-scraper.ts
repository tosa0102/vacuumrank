// app/lib/specs-scraper.ts
// SerpAPI-sök + enkel HTML-extraktion (JSON-LD + tabellheuristik)

import { SPEC_FIELD_MAP } from "./spec-sources";

function norm(s?: string) { return (s ?? "").trim(); }
function hasPa(s?: string) { return /\bpa\b/i.test(String(s)); }
function onlyNumber(s?: string) {
  if (!s) return undefined;
  const n = Number(String(s).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}
function formatPa(v?: string) {
  if (!v) return v;
  if (hasPa(v)) return v.replace(/\bpa\b/i, "Pa");
  const n = onlyNumber(v);
  return n ? `${n} Pa` : v;
}

async function serpApiSearch(query: string): Promise<string[]> {
  if (!process.env.SERPAPI_KEY) {
    console.warn("[specs-scraper] SERPAPI_KEY saknas");
    return [];
  }
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&hl=en&gl=uk&num=10&api_key=${process.env.SERPAPI_KEY}`;
  const res = await fetch(url, { next: { revalidate: 86_400 } });
  if (!res.ok) return [];
  const data = await res.json();
  const items = data?.organic_results ?? [];
  return items.map((x: any) => x?.link).filter(Boolean);
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (RankPilot bot for product spec aggregation)" },
    next: { revalidate: 86_400 },
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
      const parsed = JSON.parse(raw);
      blocks.push(parsed);
    } catch {
      // ignorera felaktiga block
    }
  }
  return blocks;
}

function pickFromAdditionalProps(props: any[] | undefined, keys: string[]): string | undefined {
  if (!Array.isArray(props)) return;
  for (const key of keys) {
    const hit = props.find((p) => norm(p?.name).toLowerCase().includes(key));
    const v = norm(hit?.value ?? hit?.valueReference ?? hit?.description);
    if (v) return v;
  }
}

function extractFromJsonLd(json: any) {
  const bag: any[] = Array.isArray(json?.["@graph"]) ? json["@graph"] : [json];
  const product = bag.find((n) => {
    const types = Array.isArray(n?.["@type"]) ? n["@type"] : [n?.["@type"]];
    return types.some((t: string) => String(t).toLowerCase() === "product");
  }) ?? json;

  const addl = product?.additionalProperty ?? product?.additionalProperties;
  const base = pickFromAdditionalProps(addl, SPEC_FIELD_MAP.base.map((x) => x.toLowerCase()));
  const navigation = pickFromAdditionalProps(addl, SPEC_FIELD_MAP.navigation.map((x) => x.toLowerCase()));
  const suction = pickFromAdditionalProps(addl, SPEC_FIELD_MAP.suction.map((x) => x.toLowerCase()));
  const mopType = pickFromAdditionalProps(addl, SPEC_FIELD_MAP.mopType.map((x) => x.toLowerCase()));

  return {
    base: norm(base),
    navigation: norm(navigation),
    suction: formatPa(norm(suction)),
    mopType: norm(mopType),
  };
}

function extractFromHtmlTables(html: string) {
  const lower = html.toLowerCase();

  function pick(keys: string[]): string | undefined {
    // leta efter <th>nyckel</th><td>värde</td> och <dt>nyckel</dt><dd>värde</dd>
    for (const key of keys) {
      const k = key.toLowerCase();

      // <th> / <td>
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

      // <dt> / <dd>
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
    suction: formatPa(norm(suction)),
    mopType: norm(mopType),
  };
}

export async function searchAndExtractSpecs({
  queries,
}: {
  queries: string[];
}): Promise<Record<string, string | undefined>> {
  const out: Record<string, string | undefined> = {};
  for (const q of queries) {
    const links = await serpApiSearch(q);
    for (const link of links) {
      try {
        const html = await fetchHtml(link);
        // 1) JSON-LD
        const blocks = await extractJsonLd(html);
        for (const b of blocks) {
          const part = extractFromJsonLd(b);
          out.base = out.base ?? part.base;
          out.navigation = out.navigation ?? part.navigation;
          out.suction = out.suction ?? part.suction;
          out.mopType = out.mopType ?? part.mopType;
        }
        // 2) HTML-tabeller (fallback)
        const fromHtml = extractFromHtmlTables(html);
        out.base = out.base ?? fromHtml.base;
        out.navigation = out.navigation ?? fromHtml.navigation;
        out.suction = out.suction ?? fromHtml.suction;
        out.mopType = out.mopType ?? fromHtml.mopType;

        // om vi redan har allt, returnera
        if (out.base && out.navigation && out.suction && out.mopType) return out;
      } catch (e) {
        console.warn("[specs-scraper] Misslyckades för:", link, e);
      }
    }
  }
  return out;
}
