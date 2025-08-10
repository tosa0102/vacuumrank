import Image from "next/image";

type Retailer = { name: string; url: string; price?: number };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function ProductCard({ product }: { product: any }) {
  const name =
    product?.name ||
    [product?.brand, product?.model].filter(Boolean).join(" ") ||
    "Unknown model";

  const price = product?.price_gbp ?? product?.price ?? undefined;

  // Bild: 1) använd product.image om den finns  2) annars placeholder med text
  const placeholder = `https://placehold.co/240x240/png?text=${encodeURIComponent(
    name.slice(0, 24)
  )}`;
  const imgSrc: string = product?.image || placeholder;
  const alt = name;

  // Återförsäljarknappar
  const retailers: Retailer[] = (() => {
    try {
      if (Array.isArray(product?.affiliate_retailers)) return product.affiliate_retailers;
      if (typeof product?.affiliate_retailers_json === "string")
        return JSON.parse(product.affiliate_retailers_json);
      if (Array.isArray(product?.affiliate_retailers_json)) return product.affiliate_retailers_json;
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
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          <Image
            src={imgSrc}
            alt={alt}
            width={240}
            height={240}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold leading-snug">{name}</div>
          {price ? <div className="text-gray-600 text-sm mt-1">~£{price}</div> : null}
          <ul className="text-sm text-gray-600 grid gap-1 mt-2">
            {product?.suction_pa ? <li>• Suction: {product.suction_pa} Pa</li> : null}
            {product?.mop_type ? <li>• Mop: {product.mop_type}</li> : null}
            {product?.dock ? <li>• Dock: {product.dock}</li> : null}
            {product?.navigation ? <li>• Navigation: {product.navigation}</li> : null}
            {product?.edge_tools ? <li>• Edge tools: {product.edge_tools}</li> : null}
          </ul>
        </div>
      </div>

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
