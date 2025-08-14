// app/lib/serpapi.ts
// Lightweight SerpAPI adapter för bilder + priser (Google Shopping).
// Kräver env: SERPAPI_KEY (lägg in i Vercel → Settings → Environment Variables).
//
// OBS: Vi cache:ar svar i 6 timmar (revalidate: 21600) för att spara API-budget.

export type VendorOffer = { url?: string; price?: number };
export type Offers = {
  image?: string; // thumbnail från Google Shopping (ofta gstatic) eller Amazon-resultat
  vendors: {
    amazon?: VendorOffer;
    currys?: VendorOffer;
    argos?: VendorOffer;
    ao?: VendorOffer;
  };
};

function parsePrice(val: unknown): number | undefined {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const n = Number(val.replace(/[^\d.,]/g, "").replace(",", ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function normalizeVendorName(name?: string): keyof Offers["vendors"] | undefined {
  const s = (name ?? "").toLowerCase();
  if (s.includes("amazon")) return "amazon";
  if (s.includes("currys")) return "currys";
  if (s.includes("argos")) return "argos";
  if (s.includes("ao")) return "ao";
  return undefined;
}

export async function fetchShoppingOffers(query: string): Promise<Offers> {
  if (!process.env.SERPAPI_KEY) {
    console.warn("SERPAPI_KEY missing; skipping SerpAPI for:", query);
    return { vendors: {} } as Offers;

  const url =
    `https://serpapi.com/search.json?engine=google_shopping&hl=en&gl=uk&q=${encodeURIComponent(
      query
    )}&api_key=${process.env.SERPAPI_KEY}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return { vendors: {} } as Offers;

    const data = await res.json();
    const results: any[] = data?.shopping_results ?? [];

    const offers: Offers = { vendors: {} };

    for (const r of results) {
      const vendor = normalizeVendorName(r?.source);
      if (!vendor) continue;

      const price = r?.extracted_price ?? parsePrice(r?.price);
      const link = r?.link as string | undefined;

      // Behåll första träffen per vendor
      if (!offers.vendors[vendor]) offers.vendors[vendor] = { url: link, price };

      // Bild: föredra Amazon, annars första bästa thumbnail
      const thumb = (r?.thumbnail as string | undefined) ?? undefined;
      if (!offers.image || vendor === "amazon") {
        if (thumb) offers.image = thumb;
      }
    }

    return offers;
  } catch {
    // Tyst fallback
    return { vendors: {} } as Offers;
  }
}
