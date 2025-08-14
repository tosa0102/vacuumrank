// app/lib/serpapi.ts
// Smart SerpAPI-adapter för Shopping-bilder + priser.
// Env: SERPAPI_KEY (läggs i Vercel project → Settings → Environment Variables)

export type VendorOffer = { url?: string; price?: number };
export type Offers = {
  image?: string;
  vendors: {
    amazon?: VendorOffer;
    currys?: VendorOffer;
    argos?: VendorOffer;
    ao?: VendorOffer;
  };
};

// ---------------- utils ----------------
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

const STOPWORDS = [
  "filter", "filters", "bag", "bags", "spare", "spares", "replacement",
  "refill", "mop cloth", "mop pads", "dust bag", "accessories",
];

function looksLikeAccessory(title?: string) {
  const t = (title ?? "").toLowerCase();
  return STOPWORDS.some(w => t.includes(w));
}

function tokenise(s: string) {
  return s.toLowerCase().split(/[\s\-_/]+/).filter(Boolean);
}

// ---------------- query builder ----------------
export type ProductLike = {
  name?: string;
  brand?: string;
  model?: string;
  asin?: string;
  ean?: string;
};

export function buildShoppingQuery(p: ProductLike): string {
  // Prioritet: brand+model → brand+name → name → ean/asin (om allt annat saknas)
  if (p.brand && p.model) return `${p.brand} ${p.model}`;
  if (p.brand && p.name) return `${p.brand} ${p.name}`;
  if (p.name) return p.name;
  if (p.ean) return p.ean;
  if (p.asin) return p.asin;
  return "";
}

// ---------------- core fetchers ----------------
export async function fetchShoppingOffersSmart(p: ProductLike): Promise<Offers> {
  const query = buildShoppingQuery(p);
  return fetchShoppingOffers(query, p);
}

// Bakåtkompatibel: låter tidigare kod kalla med ren text
export async function fetchShoppingOffers(query: string, p?: ProductLike): Promise<Offers> {
  if (!query) return { vendors: {} } as Offers;
  if (!process.env.SERPAPI_KEY) {
    console.warn("SERPAPI_KEY missing; skipping SerpAPI for:", query);
    return { vendors: {} } as Offers;
  }

  const url =
    `https://serpapi.com/search.json?engine=google_shopping&hl=en&gl=uk&num=50` +
    `&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}`;

  try {
    // För test: revalidate 60s. Höj gärna till 21600 (6h) när allt sitter.
    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) return { vendors: {} } as Offers;

    const data = await res.json();
    const results: any[] = data?.shopping_results ?? [];

    // Poängsätt enligt enkel heuristik
    const qTokens = tokenise(query);
    const vendorWeight: Record<string, number> = { amazon: 3, currys: 2, argos: 2, ao: 2 };

    const scored = results
      .map(r => {
        const title = String(r?.title ?? "");
        const vendorKey = normalizeVendorName(r?.source ?? r?.merchant) ?? "other";
        let score = 0;

        // matcha frågans tokens i titel
        const t = title.toLowerCase();
        for (const tok of qTokens) if (tok && t.includes(tok)) score += 1;

        // fult filter — sänk poäng för “spares/filters/bags”
        if (looksLikeAccessory(title)) score -= 5;

        // bonus per återförsäljare
        score += vendorWeight[vendorKey] ?? 0;

        return { r, vendorKey, score };
      })
      .sort((a, b) => b.score - a.score);

    const offers: Offers = { vendors: {} };

    for (const { r, vendorKey } of scored) {
      const vendor = vendorKey as keyof Offers["vendors"];
      if (!vendor || vendor === "other") {
        // Lagra ev. bra bild även från "other" om vi inte har någon ännu
        if (!offers.image && r?.thumbnail) offers.image = r.thumbnail;
        continue;
      }

      const price = r?.extracted_price ?? parsePrice(r?.price);
      const link = (r?.link as string | undefined) ?? (r?.product_link as string | undefined);

      // Första vettiga träffen per vendor vinner
      if (!offers.vendors[vendor]) offers.vendors[vendor] = { url: link, price };

      // Bild: använd Amazon om möjligt, annars första vettiga
      const thumb = (r?.thumbnail as string | undefined) ?? (r?.image as string | undefined);
      if ((vendor === "amazon" && thumb) || (!offers.image && thumb)) offers.image = thumb;
    }

    return offers;
  } catch (err) {
    console.warn("SerpAPI error for:", query, p, err);
    return { vendors: {} } as Offers;
  }
}
