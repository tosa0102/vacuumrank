// app/lib/specs.ts
// Tillverkare (whitelist) → Sekundära källor, med Next-cache (24h).
// Externa fetches körs inne i en unstable_cache så sidan blir snabb efter första körningen.

import { unstable_cache } from "next/cache";
import { BRAND_SOURCES, SECONDARY_SOURCES } from "./spec-sources";
import { searchAndExtractSpecs } from "./specs-scraper";

type Input = { brand?: string; model?: string; name?: string };

async function fetchSpecsUncached(p: Input) {
  const qBase =
    (p.brand && p.model) ? `${p.brand} ${p.model}` :
    (p.brand && p.name) ? `${p.brand} ${p.name}` :
    p.name ?? "";
  if (!qBase) return {};

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

// ✅ Rätta sättet: ge en statisk "prefix"-nyckel (array av strängar).
// Next bygger resten av cache-nyckeln automatiskt från funktionsargumenten.
const getSpecsCached = unstable_cache(
  fetchSpecsUncached,
  ["specs"],                 // <-- statisk prefix
  { revalidate: 86_400, tags: ["specs"] }
);

export async function fetchProductSpecs(p: Input) {
  return getSpecsCached(p);
}

function hasAny(specs: Record<string, any>) {
  return Boolean(specs.base || specs.navigation || specs.suction || specs.mopType);
}
