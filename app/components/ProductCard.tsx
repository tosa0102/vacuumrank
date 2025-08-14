"use client";

import { withAffiliate, amazonSearchFallback } from "../lib/affiliate";

type Retailer = { name: string; url: string; price?: number };

const isHttp = (s?: string) => !!s && /^https?:\/\//i.test(s || "");

export default function ProductCard({ product }: { product: any }) {
  const name =
    product?.name ||
    [product?.brand, product?.model].filter(Boolean).join(" ") ||
    "Unknown model";

  // OBS: Denna rad visar pris under rubriken (ej på knapparna).
  // Du ville bara ta bort priser på knapparna, så vi låter denna stå kvar.
  // Säg till om du vill att jag tar bort denna också.
  const price = product?.price_gbp ?? product?.price ?? undefined;

  // Bild (tillfällig placeholder om ingen giltig URL)
  const placeholder = `https://placehold.co/240x240/png?text=${encodeURIComponent(
    name.slice(0, 24)
  )}`;
  const imgSrc: string =
    product?.image && isHttp(product.image) ? product.image : placeholder;
  const alt = name;

  // Läs in retailers från produktdatan (pris ignoreras)
  const retailers: Retailer[] = (() => {
    try {
      if (Array.isArray(product?.affiliate_retailers))
        return product.affiliate_retailers;
      if (typeof product?.affiliate_retailers_json === "string")
        return JSON.parse(product.affiliate_retailers_json);
      if (Array.isArray(product?.affiliate_retailers_json))
        return product?.affiliate_retailers_json;
      return [];
    } catch {
      return [];
    }
  })();

  // Bygg knapp-lista utan någon pristext
  const buttons: Retailer[] = (
    retailers.length
      ? retailers.map((r) => ({ name: r.name, url: r.url })) // ta bort ev. prisfält helt
      : [
          { name: "Amazon", url: amazonSearchFallback(name) },
          { name: "Brand store", url: "#" },
        ]
  ).slice(0, 3);

  return (
    <div className="rounded-xl border p-4 grid gap-3">
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          <img
            src={imgSrc}
            alt={alt}
            className="w-full h-full object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = placeholder;
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold leading-snug">{name}</div>
          {price ? <div className="text-gray-600 text-sm mt-1">~£{price}</div> : null}
          <ul className="text-sm text-gray-600 grid gap-1 mt-2">
            {product?.suction_pa ? <li>• Suction: {product.suction_pa} Pa</li> : null}
            {product?.mop_type ? <li>• Mop: {product?.mop_type}</li> : null}
            {product?.dock ? <li>• Dock: {product?.dock}</li> : null}
            {product?.navigation ? <li>• Navigation: {product?.navigation}</li> : null}
            {product?.edge_tools ? <li>• Edge tools: {product?.edge_tools}</li> : null}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {buttons.map((r, i) => {
          const finalUrl = withAffiliate(r?.url || amazonSearchFallback(name));
          return (
            <a
              key={i}
              href={finalUrl}
              target="_blank"
              // Ta bort "sponsored" tills du är affiliate
              rel="nofollow noopener noreferrer"
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              {/* Inga priser här, endast butiksnamn */}
              Buy at {r.name}
            </a>
          );
        })}
      </div>
    </div>
  );
}
