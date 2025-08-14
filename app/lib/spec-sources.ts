// app/lib/spec-sources.ts
// Whitelistade domäner per varumärke + sekundära källor för UK-marknaden.

export const BRAND_ALLOWLIST: Record<string, string[]> = {
  shark: ["sharkclean.co.uk", "sharkclean.com"],
  roborock: ["roborock.com"],
  eufy: ["eufylife.com"],
  irobot: ["irobot.co.uk", "irobot.com"],
  dreame: ["dreame-technology.com", "dreame.com"],
  ecovacs: ["ecovacs.com"],
  xiaomi: ["mi.com"],
  // lägg till fler vid behov
};

export const SECONDARY_SOURCES: string[] = [
  // UK-återförsäljare med spec-sidor
  "currys.co.uk",
  "argos.co.uk",
  "ao.com",
  "johnlewis.com",
  // Tekniska datablad/press
  "press.roborock.com",
  "press.eufylife.com",
  // Lägg till fler betrodda domäner här
];

// Hjälpfunktioner
export function getBrandDomains(brand?: string): string[] {
  if (!brand) return [];
  const key = brand.toLowerCase().trim();
  return BRAND_ALLOWLIST[key] ?? [];
}
