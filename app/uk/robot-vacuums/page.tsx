import ProductCard from "../../components/ProductCard";
import CompareWidget from "../../components/CompareWidget";

// Datafiler (rotens /data)
import premium from "../../../data/uk-premium.json";
import performance from "../../../data/uk-performance.json";
import budget from "../../../data/uk-budget.json";

export const metadata = { title: "Robot vacuums — RankPilot" };

function nameOf(p: any) {
  return p?.name || [p?.brand, p?.model].filter(Boolean).join(" ");
}

export default function Page() {
  const P = Array.isArray(premium as any) ? (premium as any) : [];
  const M = Array.isArray(performance as any) ? (performance as any) : [];
  const B = Array.isArray(budget as any) ? (budget as any) : [];

  const all = [...P, ...M, ...B];

  const topPicks = [P[0], M[0], B[0]].filter(Boolean);

  return (
    <div className="grid gap-6">
      <nav className="text-sm text-gray-500">
        <a href="/">Home</a> / <span>Robot vacuums</span>
      </nav>

      <header className="grid gap-2">
        <h1 className="text-2xl font-semibold">Robot vacuums</h1>
        <p className="text-gray-600">
          Premium • Performance • Budget — desk-tested and ranked. We combine local street pricing,
          feature scoring, and review weighting.
        </p>
      </header>

      {topPicks.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-xl font-semibold">Top picks</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {topPicks.map((p, i) => (
              <div key={i} className="rounded-xl border p-4 grid gap-3">
                <div className="text-sm text-gray-500">
                  {i === 0 ? "Premium" : i === 1 ? "Performance" : "Budget"}
                </div>
                <div className="text-lg font-semibold">{nameOf(p)}</div>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Browse all</h2>

        <h3 className="font-semibold mt-2">Premium</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {P.map((p, i) => (<ProductCard key={`P${i}`} product={p} />))}
        </div>

        <h3 className="font-semibold mt-4">Performance</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {M.map((p, i) => (<ProductCard key={`M${i}`} product={p} />))}
        </div>

        <h3 className="font-semibold mt-4">Budget</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {B.map((p, i) => (<ProductCard key={`B${i}`} product={p} />))}
        </div>
      </section>

      {all.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-xl font-semibold">Compare models</h2>
          <CompareWidget products={all} />
        </section>
      )}
    </div>
  );
}
