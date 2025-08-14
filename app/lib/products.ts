// app/lib/products.ts
// Normaliserar inkommande data till ett enhetligt schema.
// Stöd för { premium, performance, budget } eller flat array med "band"/"tier".

import raw from "./data.json";

type Bands = { premium: any[]; performance: any[]; budget: any[] };

function toPoundsString(n?: number, fallback?: string) {
  if (typeof n === "number" && Number.isFinite(n)) return `£${n}`;
  return fallback;
}

function numberFromMixed(x: unknown): number | undefined {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const n = Number(x.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function normalizeProduct(x: any) {
  const priceTextCandidates =
    x.priceText ?? x.price_display ?? x.priceDisplay ?? x.price_range ?? (typeof x.price === "string" ? x.price : undefined);
  const priceValue =
    x.priceValue ??
    (typeof x.price === "number"
      ? x.price
      : numberFromMixed(priceTextCandidates));

  return {
    id: x.id ?? x.sku ?? x.asin ?? x.ean ?? x.model ?? x.name,
    name: x.name ?? x.title ?? x.modelName,
    brand: x.brand ?? x.maker ?? x.manufacturer,
    model: x.model ?? x.modelNumber ?? x.skuModel ?? x.code,
    asin: x.asin ?? x.ASIN,
    ean: x.ean ?? x.EAN ?? x.barcode,
    image: x.image ?? x.imageUrl ?? x.img ?? x.thumbnail,

    // Pris i två format: text + numeriskt värde (om möjligt)
    price: priceTextCandidates ?? toPoundsString(priceValue),
    priceValue,

    // Specs vi visar i list-raden
    base: x.base ?? x.dock,
    navigation: x.navigation ?? x.nav,
    suction: x.suction ?? x.suctionPa ?? x.pa ?? x.suction_power,
    mopType: x.mopType ?? x.mop ?? x.mop_type,

    // Betyg
    scores: {
      spec: x.scores?.spec ?? x.specScore ?? x.spec,
      review: x.scores?.review ?? x.reviewScore ?? x.review,
      value: x.scores?.value ?? x.valueScore ?? x.value,
      overall: x.scores?.overall ?? x.overallScore ?? x.overall,
    },

    prevRank: x.prevRank ?? x.previousRank ?? x.prev,

    // Retailer-länkar (används av CTA-knapparna)
    links: {
      amazon: x.links?.amazon ?? x.amazonUrl ?? x.amazon,
      currys: x.links?.currys ?? x.currysUrl ?? x.currys,
      argos: x.links?.argos ?? x.argosUrl ?? x.argos,
      ao: x.links?.ao ?? x.aoUrl ?? x.ao,
    },
  };
}

export async function getProducts(): Promise<Bands> {
  const src: any = raw ?? {};

  // Fall 1: bandad struktur
  if (!Array.isArray(src)) {
    return {
      premium: (src.premium ?? []).map(normalizeProduct),
      performance: (src.performance ?? []).map(normalizeProduct),
      budget: (src.budget ?? []).map(normalizeProduct),
    };
  }

  // Fall 2: flat array + band/tier-fält
  const byBand: Bands = { premium: [], performance: [], budget: [] };
  for (const item of src) {
    const band = String(item?.band ?? item?.tier ?? "").toLowerCase();
    if (band === "premium") byBand.premium.push(normalizeProduct(item));
    else if (band === "performance") byBand.performance.push(normalizeProduct(item));
    else if (band === "budget") byBand.budget.push(normalizeProduct(item));
  }
  return byBand;
}
