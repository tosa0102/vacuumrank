// app/lib/serpapi.ts
export type VendorOffer = { url?: string; price?: number };
export type Offers = {
  image?: string; // never Amazon host
  vendors: { amazon?: VendorOffer; currys?: VendorOffer; argos?: VendorOffer; ao?: VendorOffer };
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
    const h = new URL(u).hostname.toLowerCase();
    return h.includes("media-amazon.") || h.includes("images-amazon.") || h.endsWith("amazon.com") || h.endsWith("amazon.co.uk");
  } catch { return false; }
}
const STOPWORDS = ["filter","filters","bag","bags","spare","spares","replacement","refill","mop cloth","mop pads","dust bag","accessories"];
function looksLikeAccessory(title?: string) {
  const t = (title ?? "").toLowerCase();
  return STOPWORDS.some((w) => t.includes(w));
}
function tokenise(s: string) {
  return s.toLowerCase().split(/[\s\-_/]+/).filter(Boolean);
}

export type ProductLike = { name?: string; brand?: string; model?: string; asin?: string; ean?: string; };

export function buildShoppingQuery(p: ProductLike): string {
  if (p.brand && p.model) return `${p.brand} ${p.model}`;
  if (p.brand && p.name) return `${p.brand} ${p.name}`;
  if (p.name) return p.name;
  if (p.ean) return p.ean;
  if (p.asin) return p.asin;
  return "";
}

async function searchOnce(query: string): Promise<{ image?: string; vendors: Offers["vendors"] }> {
  if (!process.env.SERPAPI_KEY || !query) return { vendors: {} };
  const url = `https://serpapi.com/search.json?engine=google_shopping&hl=en&gl=uk&num=50&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}`;
  const res = await fetch(url, { next: { revalidate: 21_600 } });
  if (!res.ok) return { vendors: {} };
  const data = await res.json();
  const results: any[] = data?.shopping_results ?? [];

  const qTokens = tokenise(query);
  const vendorWeight: Record<string, number> = { amazon: 3, currys: 2, argos: 2, ao: 2 };

  let firstNonAmazonThumb: string | undefined;
  const vendors: Offers["vendors"] = {};

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

  for (const { r, vendorKey } of scored) {
    if (vendorKey === "other") continue;
    const vendor: keyof Offers["vendors"] = vendorKey;
    const price = r?.extracted_price ?? parsePrice(r?.price);
    const link = (r?.link as string | undefined) ?? (r?.product_link as string | undefined);
    if (!vendors[vendor]) vendors[vendor] = { url: link, price };
  }
  return { image: firstNonAmazonThumb, vendors };
}

export async function fetchShoppingOffersSmart(p: ProductLike): Promise<Offers> {
  // 1) primär query
  const q1 = buildShoppingQuery(p);
  let r1 = await searchOnce(q1);

  // 2) om ingen icke‑Amazon‑bild hittades, prova alternativ query
  if (!r1.image) {
    const alternatives = [
      p.brand && p.model ? `${p.brand} ${p.model} robot vacuum` : undefined,
      p.ean,
      p.name,
    ].filter(Boolean) as string[];

    for (const q of alternatives) {
      const r = await searchOnce(q);
      // slå ihop vendors (behåll första för varje leverantör)
      r1 = { image: r1.image || r.image, vendors: { ...r.vendors, ...r1.vendors } };
      if (r1.image) break;
    }
  }

  return { image: r1.image, vendors: r1.vendors || {} };
}

export async function fetchShoppingOffers(query: string, p?: ProductLike): Promise<Offers> {
  // Behåll signaturen för ev. äldre anrop men delegara till smart funktionen
  const base: ProductLike = p ?? { name: query };
  return fetchShoppingOffersSmart(base);
}
