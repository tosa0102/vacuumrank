// app/lib/specs.ts
import { brandSources, specFieldMap } from "./spec-sources";
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
  if (!brand || !model) {
    console.warn("fetchProductSpecs: saknar brand eller model", name);
    return {};
  }

  const brandKey = brand.toLowerCase();
  const sources = brandSources[brandKey] ?? [];
  const queries = sources.length
    ? [`${brand} ${model} site:${sources.join(" OR site:")}`]
    : [`${brand} ${model}`];

  // Först: försök tillverkarens egna whitelistasidor
  let specs = await searchAndExtractSpecs({ queries, fields: specFieldMap });
  if (hasAllSpecs(specs)) return specs;

  // Sekundära källor om officiell sida saknar något
  const secondaryDomains = [
    "currys.co.uk",
    "ao.com",
    "argos.co.uk",
    "very.co.uk",
    "johnlewis.com",
  ];
  const secondaryQueries = [`${brand} ${model} site:${secondaryDomains.join(" OR site:")}`];
  const secondarySpecs = await searchAndExtractSpecs({
    queries: secondaryQueries,
    fields: specFieldMap,
  });

  // Kombinera officiella + sekundära (officiella tar företräde)
  specs = { ...secondarySpecs, ...specs };
  return specs;
}

function hasAllSpecs(specs: Record<string, any>) {
  return Object.keys(specFieldMap).every((k) => Boolean(specs[k]));
}
