// app/lib/spec-sources.ts
// ➕ Whitelistade domäner per varumärke + nycklar för att hämta specs

export const brandSources: Record<string, string[]> = {
  shark: ["sharkclean.co.uk", "sharkclean.com"],
  roborock: ["roborock.com"],
  eufy: ["eufylife.com"],
  irobot: ["irobot.co.uk", "irobot.com"],
  dreame: ["dreame.com"],
  ecovacs: ["ecovacs.com"],
};

export const specFieldMap: Record<string, string[]> = {
  base: ["base type", "dock type", "base", "dock"],
  navigation: ["navigation", "nav type", "mapping"],
  suction: ["suction", "suction power", "pa"],
  mopType: ["mop type", "mop system", "mopping"],
};
