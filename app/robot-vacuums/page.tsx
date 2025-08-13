import { headers } from "next/headers";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getMarketFromHost, currencyCode } from "@/app/lib/market";
import { Band, Product, getProducts } from "@/app/lib/products";

const CompareBar = dynamic(() => import('@/app/components/CompareBar'), { ssr: false });
const CompareToggle = dynamic(() => import('@/app/components/CompareToggle'), { ssr: false });
const CompareInline = dynamic(() => import('@/app/components/CompareInline'), { ssr: false });

function fmtCurrency(v?: number, cc: string='GBP'){
  if (v===undefined || v===null) return undefined;
  return new Intl.NumberFormat(undefined,{style:'currency', currency: cc}).format(v);
}
function bandTitle(b: Band) {
  if (b==='premium') return 'Premium (≥ £900)';
  if (b==='performance') return 'Performance (£400–£899)';
  return 'Budget (≤ £399)';
}
function ScorePill({label, v}:{label:string; v?:number}) {
  if (v===undefined) return null;
  return <div className="px-2 py-1 rounded-full bg-gray-100 text-sm">{label} {v.toFixed(2)}</div>;
}
function StatRow({label, value}:{label:string; value?:string|number}) {
  if (value===undefined || value===null || value==='') return null;
  return <div className="text-sm"><span className="text-gray-500">{label}: </span><span className="text-gray-800">{value}</span></div>;
}

export const metadata = {
  title: "Best Robot Vacuums — RankPilot",
  description: "Ranked picks by price band with local street pricing, specs and review-weighted scores.",
};

export default async function Page() {
  const host = headers().get('host') || '';
  const market = getMarketFromHost(host);
  const cc = currencyCode(market);
  const all = (await getProducts(market)).filter(p => !!p?.band && !!p?.name);

  const byBand: Record<Band, Product[]> = { premium: [], performance: [], budget: [] };
  all.forEach(p => byBand[p.band].push(p));
  (Object.keys(byBand) as Band[]).forEach(b => byBand[b].sort((a,bp) => (bp.scores?.overall ?? 0) - (a.scores?.overall ?? 0)));

  const winners = {
    premium: byBand.premium[0],
    performance: byBand.performance[0],
    budget: byBand.budget[0],
  };

  return (
    <main id="top" className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      {/* Hero */}
      <section className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-semibold">Best Robot Vacuums</h1>
        <p className="text-gray-600">We combine live street pricing, features/specs and review data. Updated monthly.</p>
      </section>

      {/* TL;DR Winners */}
      <section className="grid md:grid-cols-3 gap-4">
        {(['premium','performance','budget'] as Band[]).map((b) => {
          const p = winners[b];
          return (
            <article key={b} className="rounded-xl border p-4 grid gap-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">{bandTitle(b)}</div>
              {p ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center">
                      <img src={p.image || `https://placehold.co/120x120?text=${encodeURIComponent(p.name.slice(0,18))}`} alt={p.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-semibold leading-snug">{p.name}</div>
                      <div className="text-sm text-gray-600">{fmtCurrency(p.price_gbp ?? p.price, cc) ?? '—'}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ScorePill label="Spec" v={p.scores?.spec} />
                    <ScorePill label="Review" v={p.scores?.review} />
                    <ScorePill label="Value" v={p.scores?.value} />
                    <ScorePill label="Overall" v={p.scores?.overall} />
                  </div>
                  <Link href={`#${b}`} className="text-sm font-medium text-blue-600 hover:underline w-fit">See {b} picks →</Link>
                </>
              ) : (
                <div className="text-sm text-gray-500">No winner yet.</div>
              )}
            </article>
          );
        })}
      </section>

      {/* Ranked lists per band (1–10) */}
      {(['premium','performance','budget'] as Band[]).map((band) => (
        <section key={band} id={band} className="space-y-4">
          <h2 className="text-2xl font-semibold">{bandTitle(band)} — Top picks</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {byBand[band].slice(0,10).map((p, idx) => (
              <article key={p.id || p.name+idx} className="rounded-xl border p-4 grid gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-black/80 text-white grid place-items-center text-sm font-semibold">{idx+1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold leading-snug">{p.name}</div>
                    <div className="text-sm text-gray-600">{fmtCurrency(p.price_gbp ?? p.price, cc) ?? '—'}</div>
                  </div>
                  <div className="w-20 h-20 rounded-lg bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                    <img src={p.image || `https://placehold.co/140x140?text=${encodeURIComponent(p.name.slice(0,12))}`} alt={p.name} className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-x-6 gap-y-1">
                  <StatRow label="Price" value={fmtCurrency(p.price_gbp ?? p.price, cc) ?? '—'} />
                  <StatRow label="Base" value={p.base} />
                  <StatRow label="Navigation" value={p.navigation} />
                  <StatRow label="Suction (Pa)" value={p.suction_pa} />
                  <StatRow label="Mop type" value={p.mop_type} />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <ScorePill label="Spec" v={p.scores?.spec}/>
                  <ScorePill label="Review" v={p.scores?.review}/>
                  <ScorePill label="Value" v={p.scores?.value}/>
                  <ScorePill label="Overall" v={p.scores?.overall}/>
                  {p.scores?.prevRank ? (
                    <div className="px-2 py-1 rounded-full bg-gray-50 text-sm text-gray-600">Prev #{p.scores.prevRank}</div>
                  ) : null}
                </div>

                {/* CTA + Compare */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <a href="#" className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50">Buy at Amazon</a>
                  <a href="#" className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50">Buy at Brand store</a>
                  <CompareToggle id={p.id} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {/* Compare – inline, samma sida */}
      <CompareInline products={all.map(p=>({
        id:p.id, name:p.name, band:p.band,
        price:p.price, price_gbp:p.price_gbp,
        base:p.base, navigation:p.navigation, suction_pa:p.suction_pa, mop_type:p.mop_type,
        scores:p.scores, image:p.image
      }))} currencyCode={cc} />

      {/* Sticky compare bar längst ner i viewport */}
      <CompareBar />
    </main>
  );
}
