// app/lib/specs-scraper.ts
// Enkel SerpAPI-baserad hämtare som söker produktens sida
// och extraherar specifikationer baserat på definierade nycklar.

import { specFieldMap } from "./spec-sources";

async function serpApiSearch(query: string) {
  if (!process.env.SERPAPI_KEY) {
    console.warn("SERPAPI_KEY saknas – specs-scraper körs inte");
    return [];
  }
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&engine=google&api_key=${process.env.SERPAPI_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const organic = data.organic_results ?? [];
  return organic.map((r: any) => r.link).filter(Boolean);
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) return "";
  return await res.text();
}

function extractFieldFromHtml(html: string, fieldKeys: string[]): string | undefined {
  const lower = html.toLowerCase();
  for (const key of fieldKeys) {
    const idx = lower.indexOf(key.toLowerCase());
    if (idx !== -1) {
      const snippet = lower.slice(idx, idx + 200);
      const match = snippet.match(/(\d{2,5}\s?pa|\d+(\.\d+)?\s?(w|watt|aw|air watts)|lidar|camera|gyro|self-empty|dual spinning|vibra-mop|pad|wash\/dry)/i);
      if (match) return match[0];
    }
  }
  return undefined;
}

export async function searchAndExtractSpecs({
  queries,
  fields,
}: {
  queries: string[];
  fields: Record<string, string[]>;
}): Promise<Record<string, string | undefined>> {
  const result: Record<string, string | undefined> = {};
  for (const q of queries) {
    const links = await serpApiSearch(q);
    for (const link of links) {
      try {
        const html = await fetchHtml(link);
        for (const [fieldName, keys] of Object.entries(fields)) {
          if (!result[fieldName]) {
            const val = extractFieldFromHtml(html, keys);
            if (val) result[fieldName] = val;
          }
        }
      } catch (err) {
        console.warn("Kunde inte hämta/parse:a:", link, err);
      }
      if (Object.keys(result).length >= Object.keys(fields).length) {
        return result;
      }
    }
  }
  return result;
}
