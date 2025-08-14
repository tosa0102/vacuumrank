// app/lib/spec-sources.ts
// Whitelistade domäner per varumärke + sekundära källor (UK) och nycklar för parsning

export const BRAND_SOURCES: Record<string, string[]> = {
  shark: ["sharkclean.co.uk", "sharkclean.com"],
  roborock: ["roborock.com"],
  eufy: ["eufylife.com"],
  irobot: ["irobot.co.uk", "irobot.com"],
  dreame: ["dreame.com", "dreame-technology.com"],
  ecovacs: ["ecovacs.com"],
  xiaomi: ["mi.com"],
  samsung: ["samsung.com"],
  dyson: ["dyson.co.uk", "dyson.com"],
};

export const SECONDARY_SOURCES: string[] = [
  "currys.co.uk",
  "argos.co.uk",
  "ao.com",
  "johnlewis.com",
  "very.co.uk",
];

// Nyckelord som hjälper extraktion i tabeller/JSON-LD
export const SPEC_FIELD_MAP: Record<string, string[]> = {
  base: ["dock", "base", "station", "charging dock", "self-empty", "wash", "dry"],
  navigation: ["navigation", "mapping", "lidar", "laser", "camera", "vslam", "gyro"],
  suction: ["suction", "suction power", "pa"],
  mopType: ["mop", "mopping", "mop type", "pad", "spin"],
};
