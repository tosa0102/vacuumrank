// app/lib/specs.ts
// Prioritet: Tillverkare (whitelist) → Sekundära källor (UK).
// Ingen fallback till data.json. Suction normaliseras till "<tal> Pa".

import { BRAND_SOURCES, SECONDARY_SOURCES, SPEC_FIELD_MAP } from "./spec-sources";
import { searchAndExtractSpecs } from "./specs-scraper";

export async function fetchProductSpecs({
  brand,
  model,
  name,
}: {
  brand?: string;
  model?: string;
  name?: string;
}) {
  const qBase =
    (brand && model) ? `${brand} ${model}` :
    (brand && name) ? `${brand} ${name}` :
    name ?? "";
  if (!qBase) return {};

  // 1) Tillverkare — whitelistas
  const bKey = (brand ?? "").toLowerCase();
  const manu = BRAND_SOURCES[bKey] ?? [];
  const manuQueries = manu.length ? [`${qBase} site:${manu.join(" OR site:")}`] : [`${qBase}`];

  let specs = await searchAndExtractSpecs({ queries: manuQueries });
  if (hasAny(specs)) return specs;

  // 2) Sekundära källor (UK retailers / datablad)
  const secQueries = [`${qBase} site:${SECONDARY_SOURCES.join(" OR site:")}`];
  const secondary = await searchAndExtractSpecs({ queries: secQueries });

  // Officiell info prioriteras om den finns, annars sekundär
  specs = { ...secondary, ...specs };
  return specs;
}

function hasAny(specs: Record<string, any>) {
  return Boolean(specs.base || specs.navigation || specs.suction || specs.mopType);
}
function hasAll(specs: Record<string, any>) {
  return Object.keys(SPEC_FIELD_MAP).every((k) => Boolean(specs[k]));
}
