import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";

// If your lib path is different, adjust to: "@/lib/products" or similar
import { getProducts } from "@/app/lib/products";

// Client-only compare widgets
const CompareInline = dynamic(() => import("@/app/components/CompareInline"), { ssr: false });
const CompareBar = dynamic(() => import("@/app/components/CompareBar"), { ssr: false });

export const metadata: Metadata = {
  title: "Best Robot Vacuums — Ranked & Compared",
  description:
    "Independent rankings of the best robot vacuums across Premium, Performance, and Budget bands — with side‑by‑side comparison.",
  alternates: { canonical: "/robot-vacuums" },
};

// ——— Helpers ———
function ScorePill({ label, value }: { label: string; value?: number | string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-slate-700 border-slate-200 bg-white/70">
      <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
      <span>{value ?? "–"}</span>
    </span>
  );
}

function StatRow({ k, v }: { k: string; v?: string | number }) {
  return (
    <div className="grid grid-cols-12 gap-3 text-sm">
      <div className="col-span-4 text-slate-500">{k}</div>
      <div className="col-span-8 font-medium text-slate-800">{v ?? "–"}</div>
    </div>
  );
}

function RankBadge({ n }: { n: number }) {
  const palette = [
    "bg-emerald-600 text-white",
    "bg-indigo-600 text-white",
    "bg-amber-600 text-white",
  ];
  const cls = n <= 3 ? palette[n - 1] : "bg-slate-200 text-slate-800";
  return (
    <div className={`h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold grid ${cls}`}>#{n}</div>
  );
}

// Safe image wrapper (remote images only per next.config images.remotePatterns)
function ProductImage({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return (
      <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/60" />
    );
  }
  return (
    <div className="relative h-28 w-28 overflow-hidden rounded-xl ring-1 ring-slate-200/60 bg-white">
      {/* "fill" layout keeps card sizes consistent */}
      <Image src={src} alt={alt} fill className="object-contain p-2" sizes="112px" />
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-8 pb-6 md:pt-12 md:pb-8">
      <div className="grid items-center gap-6 md:grid-cols-12">
        <div className="md:col-span-7">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Best Robot Vacuums in the UK
          </h1>
          <p className="mt-3 text-slate-600 md:text-lg">
            Our lab‑weighted rankings for 2025, split by price band. Clear winners, transparent scoring, and a
            built‑in compare table.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <a href="#winners" className="rounded-full border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800 hover:bg-slate-50">
              TL;DR Winners
            </a>
            <a href="#compare" className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white hover:bg-black">
              Compare
            </a>
          </div>
        </div>
        <div className="md:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <li className="flex items-center justify-between"><span className="text-slate-500">Premium band</span><span className="font-semibold">£900–£1,500</span></li>
              <li className="flex items-center justify-between"><span className="text-slate-500">Performance band</span><span className="font-semibold">£400–£900</span></li>
              <li className="flex items-center justify-between"><span className="text-slate-500">Budget band</span><span className="font-semibold">Under £400</span></li>
              <li className="flex items-center justify-between"><span className="text-slate-500">Methodology</span><span className="font-semibold">Spec • Review • Value</span></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function TLDRWinners({ winners }: { winners: any[] }) {
  return (
    <section id="winners" className="mx-auto max-w-6xl px-4 pt-2 pb-6 md:pb-8">
      <h2 className="text-xl font-bold text-slate-900">TL;DR winners</h2>
      <p className="mt-1 text-sm text-slate-600">Premium • Performance • Budget</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {winners.map((p, i) => (
          <article key={p.id ?? i} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <RankBadge n={i + 1} />
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-slate-900">{p.name ?? "Model"}</h3>
                <p className="text-sm text-slate-500">{p.bandLabel ?? ["Premium", "Performance", "Budget"][i]}</p>
              </div>
              <ProductImage src={p.image} alt={p.name ?? "Robot vacuum"} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <ScorePill label="Overall" value={p.scores?.overall} />
              <ScorePill label="Spec" value={p.scores?.spec} />
              <ScorePill label="Review" value={p.scores?.review} />
              <ScorePill label="Value" value={p.scores?.value} />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-600">Street price</span>
              <span className="font-semibold text-slate-900">{p.price ?? "—"}</span>
            </div>
            <div className="mt-3">
              <a
                href={p.buyUrl ?? "#"}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
              >
                Buy
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BandList({ title, items, anchor }: { title: string; items: any[]; anchor: string }) {
  return (
    <section id={anchor} className="mx-auto max-w-6xl px-4 pt-6 pb-4">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">Top 10 in rank order</p>
        </div>
        <a href="#compare" className="text-sm font-medium text-slate-700 hover:text-slate-900">Go to Compare →</a>
      </div>
      <ol className="space-y-3">
        {items.map((p: any, idx: number) => (
          <li key={p.id ?? idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-4">
              <RankBadge n={idx + 1} />
              <ProductImage src={p.image} alt={p.name ?? "Robot vacuum"} />
              <div className="grid w-full gap-2 sm:grid-cols-12">
                <div className="sm:col-span-5 min-w-0">
                  <h3 className="truncate text-base font-semibold text-slate-900">{p.name ?? "Model"}</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <ScorePill label="Overall" value={p.scores?.overall} />
                    <ScorePill label="Spec" value={p.scores?.spec} />
                    <ScorePill label="Review" value={p.scores?.review} />
                    <ScorePill label="Value" value={p.scores?.value} />
                  </div>
                  <div className="mt-2 text-sm text-slate-600">Prev rank: {p.prevRank ?? "—"}</div>
                </div>
                {/* Spec stack */}
                <div className="sm:col-span-5 grid gap-1.5">
                  <StatRow k="Price" v={p.price ?? p.priceText} />
                  <StatRow k="Base" v={p.base ?? p.dock} />
                  <StatRow k="Navigation" v={p.navigation} />
                  <StatRow k="Suction" v={p.suction} />
                  <StatRow k="Mop type" v={p.mopType} />
                </div>
                {/* CTA */}
                <div className="sm:col-span-2 flex items-end justify-end">
                  <div className="flex flex-col items-end gap-2">
                    <a
                      href={p.buyUrl ?? "#"}
                      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                    >
                      Buy
                    </a>
                    {/* Compare toggle lives on the ProductCard normally; leave a placeholder spot here if needed */}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function QuickNav() {
  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto px-4 py-2 text-sm">
        <a href="#winners" className="rounded-full px-3 py-1 font-medium text-slate-700 hover:bg-slate-100">Winners</a>
        <a href="#premium" className="rounded-full px-3 py-1 font-medium text-slate-700 hover:bg-slate-100">Premium</a>
        <a href="#performance" className="rounded-full px-3 py-1 font-medium text-slate-700 hover:bg-slate-100">Performance</a>
        <a href="#budget" className="rounded-full px-3 py-1 font-medium text-slate-700 hover:bg-slate-100">Budget</a>
        <a href="#compare" className="ml-auto rounded-full bg-slate-900 px-3 py-1 font-semibold text-white hover:bg-black">Compare</a>
      </div>
    </nav>
  );
}

export default async function Page() {
  // Data shape expected: { premium: Product[], performance: Product[], budget: Product[] }
  // If your `getProducts()` differs, adapt the mapping here.
  const { premium = [], performance = [], budget = [] } = (await getProducts()) as any;

  const winners = [premium?.[0], performance?.[0], budget?.[0]].filter(Boolean);

  return (
    <main className="min-h-screen bg-slate-50/50">
      <Hero />
      <QuickNav />
      <TLDRWinners winners={winners} />

      <BandList title="Premium" items={premium} anchor="premium" />
      <BandList title="Performance" items={performance} anchor="performance" />
      <BandList title="Budget" items={budget} anchor="budget" />

      {/* Compare section lives on the same page */}
      <section id="compare" className="mx-auto max-w-6xl px-4 pt-8 pb-24">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Compare</h2>
          <a href="#top" className="text-sm font-medium text-slate-700 hover:text-slate-900">Back to top ↑</a>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          {/* Expect your existing client component to render the zebra rows + best-in-row highlights */}
          <CompareInline />
        </div>
      </section>

      {/* Sticky bottom CompareBar (client) */}
      <CompareBar />
    </main>
  );
}
