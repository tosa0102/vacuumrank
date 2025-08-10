import Link from "next/link";

type Retailer = { name: string; url: string; price?: number };

export default function ProductCard({ product }: { product: any }) {
  const name =
    product.name ||
    [product.brand, product.model].filter(Boolean).join(" ") ||
    "Unknown model";
  const price = product.price_gbp ?? product.price ?? undefined;

  // Parse affiliate retailers (stringified JSON or array)
  const retailers: Retailer[] = (() => {
    try {
      if (Array.isArray(product.affiliate_retailers)) return product.affiliate_retailers;
      if (typeof product.affiliate_retailers_json === "string")
        return JSON.parse(product.affiliate_retailers_json);
      if (Array.isArray(product.affiliate_retailers_json)) return product.affiliate_retailers_json;
      return [];
    } catch {
      return [];
    }
  })();

  const buttons = (retailers.length ? retailers : [
    { name: "Amazon", url: "#" },
    { name: "Brand store", url: "#" },
  ]).slice(0, 3);

  return (
    <div className="rounded-xl border p-4 grid gap-3">
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-sm text-gray-600">
          {(product.brand || name).toString().slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{name}</div>
          {price ? <div className="text-gray-600 text-sm">~£{price}</div> : null}
        </div>
      </div>

      <ul className="text-sm text-gray-600 grid gap-1">
        {product.suction_pa ? <li>• Suction: {product.suction_pa} Pa</li> : null}
        {product.mop_type ? <li>• Mop: {product.mop_type}</li> : null}
        {product.dock ? <li>• Dock: {product.dock}</li> : null}
        {product.navigation ? <li>• Navigation: {product.navigation}</li> : null}
        {product.edge_tools ? <li>• Edge tools: {product.edge_tools}</li> : null}
      </ul>

      <div className="flex flex-wrap gap-2">
        {buttons.map((r, i) => (
          <a
            key={i}
            href={r.url}
            target="_blank"
            rel="nofollow sponsored"
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Buy at {r.name}
          </a>
        ))}
      </div>
    </div>
  );
}
