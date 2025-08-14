// app/lib/specs.ts
// Tillverkare (whitelist) → Sekundära källor, med Next-cache (24h).
// Tar emot "hintUrls" (butikslänkar) som testas först.

import { unstable_cache } from "next/cache";
import { BRAND_SOURCES, SECONDARY_SOURCES } from "./spec-sources";
import { searchAndExtractSpecs, ScrapeResult } from "./specs-scraper";

type Input = { brand?: string; model?: string; name?: string; hintUrls?: string[] };

async function fetchSpecsUncached(p: Input): Promise<ScrapeResult> {
  const qBase =
    (p.brand && p.model) ? `${p.brand} ${p.model}` :
    (p.brand && p.name) ? `${p.brand} ${p.name}` :
    p.name ?? "";
  if (!qBase) return {};

  // 0) Hints (t.ex. Currys/Argos/AO URL vi redan har)
  if (p.hintUrls && p.hintUrls.length) {
    const hinted = await searchAndExtractSpecs({ queries: [qBase], hintUrls: p.hintUrls });
    if (hasAny(hinted)) return hinted;
  }

  // 1) Tillverkare — whitelist
  const manu = BRAND_SOURCES[(p.brand ?? "").toLowerCase()] ?? [];
  const manuQueries = manu.length ? [`${qBase} site:${manu.join(" OR site:")}`] : [`${qBase}`];
  let specs = await searchAndExtractSpecs({ queries: manuQueries });
  if (hasAny(specs)) return specs;

  // 2) Sekundära källor (UK)
  const secQueries = [`${qBase} site:${SECONDARY_SOURCES.join(" OR site:")}`];
  const secondary = await searchAndExtractSpecs({ queries: secQueries });
  specs = { ...secondary, ...specs };
  return specs;
}

const getSpecsCached = unstable_cache(fetchSpecsUncached, ["specs"], { revalidate: 86_400, tags: ["specs"] });

export async function fetchProductSpecs(p: Input) {
  return getSpecsCached(p);
}

function hasAny(x: Record<string, any>) {
  return Boolean(x.base || x.navigation || x.suction || x.mopType);
}
