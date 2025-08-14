// app/lib/serpapi.ts
// SerpAPI-adapter för Shopping-bilder + priser.
// Env: SERPAPI_KEY (Vercel → Project → Settings → Environment Variables)

export type VendorOffer = { url?: string; price?: number };
export type Offers = {
  image?: string; // OBS: aldrig Amazon-bild
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

// https + absolut url
function normalizeThumb(u?: string): string | undefined {
  if (!u) return undefined;
  let s = u.trim();
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("http://")) s = "https://" + s.slice(7);
  if (s.startsWith("https://") || s.startsWith("data:image/")) return s;
  return undefined;
}

function isAmazonHost(u?: string): boolean {
  if (!u) return false;
  try {
    const host = new URL(u).hostname.toLowerCase();
    return (
      host.includes("media-amazon.") ||
      host.includes("images-amazon.") ||
      host.endsWith("amazon.com") ||
      host.endsWith("amazon.co.uk")
    );
  } catch {
    return false;
  }
}

const STOPWORDS = ["filter","filters","bag","bags","spare","spares","replacement","refill","mop cloth","mop pads","dust bag","accessories"];
function looksLikeAccessory(title?: string) {
  const t = (title ?? "").toLowerCase();
  return STOPWORDS.some((w) => t.includes(w));
}
function tokenise(s: string) {
  return s.toLowerCase().split(/[\s\-_/]+/).filter(Boolean);
}

// ---------------- query builder ----------------
export type ProductLike = { name?: string; brand?: string; model?: string; asin?: string; ean?: string; };

export function buildShoppingQuery(p: ProductLike): string {
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
    // 6 timmar cache (ISR)
    const res = await fetch(url, { next: { revalidate: 21_600 } });
    if (!res.ok) return { vendors: {} } as Offers;

    const data = await res.json();
    const results: any[] = data?.shopping_results ?? [];

    const qTokens = tokenise(query);
    const vendorWeight: Record<string, number> = { amazon: 3, currys: 2, argos: 2, ao: 2 };

    // Vi väljer bild separat nedan, och tillåter INTE Amazon-bilder
    let firstNonAmazonThumb: string | undefined;

    const scored = results
      .map((r) => {
        const title = String(r?.title ?? "");
        const normalized = normalizeVendorName(r?.source ?? r?.merchant);
        const vendorKey: "amazon" | "currys" | "argos" | "ao" | "other" = normalized ?? "other";

        let score = 0;
        const t = title.toLowerCase();
        for (const tok of qTokens) if (tok && t.includes(tok)) score += 1;
        if (looksLikeAccessory(title)) score -= 5;
        score += vendorWeight[vendorKey] ?? 0;

        const rawThumb = (r?.thumbnail as string | undefined) ?? (r?.image as string | undefined);
        const thumb = normalizeThumb(rawThumb);
        if (thumb && !firstNonAmazonThumb && !isAmazonHost(thumb)) firstNonAmazonThumb = thumb;

        return { r, vendorKey, score };
      })
      .sort((a, b) => b.score - a.score);

    const offers: Offers = { vendors: {} };

    // Fyll vendor-länkar/priser (oberoende av bild)
    for (const { r, vendorKey } of scored) {
      if (vendorKey === "other") continue;
      const vendor: keyof Offers["vendors"] = vendorKey;
      const price = r?.extracted_price ?? parsePrice(r?.price);
      const link = (r?.link as string | undefined) ?? (r?.product_link as string | undefined);
      if (!offers.vendors[vendor]) offers.vendors[vendor] = { url: link, price };
    }

    // Bildval: ALDRIG Amazon-host. Om vi inte hittar någon annan: lämna tomt.
    offers.image = firstNonAmazonThumb; // kan vara undefined → UI visar placeholder

    return offers;
  } catch (err) {
    console.warn("SerpAPI error for:", query, p, err);
    return { vendors: {} } as Offers;
  }
}
