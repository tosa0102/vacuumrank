// app/lib/products.ts
type Raw = any;
type Prod = {
  id?: string;
  name: string;
  image?: string;
  price?: string;       // "~£999" (visning)
  priceValue?: number;  // 999 (för jämförelse)
  base?: string;        // PDF: "Base"
  navigation?: string;
  suction?: number;     // i Pa
  mopType?: string;
  scores?: { overall?: number; spec?: number; review?: number; value?: number };
  prevRank?: string | number;
  buyUrl?: string;
};

function mapOne(x: Raw): Prod {
  return {
    id: x.id ?? x.slug,
    name: x.model ?? x.name,
    image: x.imageUrl ?? x.img,
    price: x.priceText ?? x.price_range ?? x.priceDisplay ?? x.price?.toString(),
    priceValue:
      x.priceValue ??
      (typeof x.price === "number"
        ? x.price
        : Number(String(x.priceText ?? x.price_range ?? x.priceDisplay ?? "").replace(/[^0-9.]/g, ""))) ||
      undefined,
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

// GÖR parametern valfri här (fixar även builden om du väljer alternativ B)
export async function getProducts(market: string | { market: string } = "uk") {
  const m = typeof market === "string" ? market : market?.market ?? "uk";
  const raw = await import("./data.json"); // byt till din källa
  const pick = (arr: any[]) => (arr ?? []).map(mapOne);

  return {
    premium: pick(raw.premium),
    performance: pick(raw.performance),
    budget: pick(raw.budget),
  };
}
