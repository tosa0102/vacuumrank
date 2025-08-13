type Raw = any;

export type Prod = {
  id?: string;
  name: string;
  image?: string;
  price?: string;        // "~£999" (visning)
  priceValue?: number;   // 999 (för jämförelse)
  base?: string;         // PDF: "Base"
  navigation?: string;
  suction?: number;      // i Pa
  mopType?: string;
  scores?: { overall?: number; spec?: number; review?: number; value?: number };
  prevRank?: string | number;
  buyUrl?: string;
};

// Hjälpare: plocka ut tal (eller undefined) ur diverse indata
function numFrom(val: unknown): number | undefined {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const n = Number(val.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function mapOne(x: Raw): Prod {
  const priceText =
    x.priceText ?? x.price_range ?? x.priceDisplay ?? (typeof x.price === "string" ? x.price : undefined);

  const priceValue =
    x.priceValue ??
    (typeof x.price === "number" ? x.price : numFrom(priceText));

  return {
    id: x.id ?? x.slug,
    name: x.model ?? x.name,
    image: x.imageUrl ?? x.img,
    price: priceText ?? x.price?.toString(),
    priceValue,
    base: x.base ?? x.dock,
    navigation: x.navigation ?? x.nav,
    suction: x.suctionPa ?? x.suction,
    mopType: x.mopType ?? x.mop,
    scores: {
      overall: x.scores?.overall ?? x.score_overall,
      spec:    x.scores?.spec    ?? x.score_spec,
      review:  x.scores?.review  ?? x.score_review,
      value:   x.scores?.value   ?? x.score_value,
    },
    prevRank: x.prevRank ?? x.rank_prev,
    buyUrl: x.buy?.amazon ?? x.buyUrl,
  };
}

// Parametern är valfri → du kan kalla getProducts() utan argument
export async function getProducts(market: string | { market: string } = "uk") {
  const _m = typeof market === "string" ? market : market?.market ?? "uk";
  // Byt till var din data faktiskt ligger
  const raw = await import("@/app/lib/data.json");
  const pick = (arr: any[]) => (arr ?? []).map(mapOne);

  return {
    premium: pick(raw.premium),
    performance: pick(raw.performance),
    budget: pick(raw.budget),
  };
}
