// app/robot-vacuums/page.tsx — TOP SECTION (clean + stable)
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import { getProducts } from "@/app/lib/products";

export const revalidate = 86_400; // uppdatera datumet (månad/år) dagligen

// Client-only (används längre ned)
const CompareInline = dynamic(() => import("@/app/components/CompareInline"), { ssr: false });
const CompareBar = dynamic(() => import("@/app/components/CompareBar"), { ssr: false });

export const metadata: Metadata = {
  title: "Best Robot Vacuums — Ranked & Compared",
  description:
    "Independent rankings of the best robot vacuums across Premium, Performance, and Budget bands — with side-by-side comparison.",
  alternates: { canonical: "/robot-vacuums" },
};

// Header-config
const CTA_TEXT = "Read: Best Robot Vacuums 2025 (UK)";
const CTA_HREF = "/best-robot-vacuum-2025";
const LOGO_SRC = "/rankpilot-logo.jpg"; // lägg i /public
const HERO_DATE = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date());

function HeaderFromDesign() {
  return (
    <header className="mx-auto w-full max-w-6xl px-4 pt-6">
      {/* Rad: större logo vänster, titelkluster centrerat */}
      <div className="grid items-center gap-4 md:grid-cols-12">
        {/* Logo only — större, ingen ring */}
        <div className="md:col-span-3">
          <div className="relative h-28 w-28 sm:h-32 sm:w-32">
            <Image
              src={LOGO_SRC}
              alt="RankPilot"
              fill
              className="object-contain"
              sizes="128px"
              priority
            />
          </div>
        </div>

        {/* Centrerad H1 + underrad + pill-knapp */}
        <div className="md:col-span-9 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Best Robot Vacuums in the UK <span className="font-medium">({HERO_DATE})</span>
          </h1>
          <p className="mt-1 text-sm md:text-base text-slate-600">
            <span className="font-medium">Premium</span> • <span className="font-medium">Performance</span> • <span className="font-medium">Budget</span>
            <span className="mx-2">—</span> desk-tested and ranked
          </p>
          <div className="mt-3 flex justify-center">
            <a
              href={CTA_HREF}
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              {CTA_TEXT}
            </a>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mt-4 text-sm text-slate-500">
        <div className="flex items-center gap-1.5">
          <a href="/" className="hover:text-slate-700">Home</a>
          <span className="text-slate-400">/</span>
          <span className="font-medium text-slate-700">Robot vacuums</span>
        </div>
      </nav>

      {/* Sektionstitel */}
      <div className="mt-4">
        <h2 className="text-2xl font-semibold text-slate-900">Top picks</h2>
      </div>
    </header>
  );
}


// ——— REST OF PAGE (unchanged layout; we will refine in later steps) ———
function ScorePill({ label, value }: { label: string; value?: number | string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 text-xs font-medium text-slate-700">
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
    <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${cls}`}>#{n}</div>
  );
}

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/60" />;
  }
  return (
    <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/60">
      <Image src={src} alt={alt} fill className="object-contain p-2" sizes="112px" />
    </div>
  );
}

function TLDRWinners({ winners }: { winners: any[] }) {
  return (
    <section id="winners" className="mx-auto max-w-6xl px-4 pt-2 pb-6 md:pb-8">
      <h2 className="text-xl font-bold text-slate-900">TL;DR winners</h2>
      <p className="mt-1 text-sm text-slate-600">Premium • Performance • Budget</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {winners.map((p, i) => (
          <article key={p.id ?? i} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
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
              <a href={p.buyUrl ?? "#"} className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black">
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
                <div className="min-w-0 sm:col-span-5">
                  <h3 className="truncate text-base font-semibold text-slate-900">{p.name ?? "Model"}</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <ScorePill label="Overall" value={p.scores?.overall} />
                    <ScorePill label="Spec" value={p.scores?.spec} />
                    <ScorePill label="Review" value={p.scores?.review} />
                    <ScorePill label="Value" value={p.scores?.value} />
                  </div>
                  {p.prevRank && <div className="mt-2 text-sm text-slate-600">Prev rank: {p.prevRank}</div>}
                </div>
                <div className="grid gap-1.5 sm:col-span-5">
                  <StatRow k="Price" v={p.price ?? p.priceText} />
                  <StatRow k="Base" v={p.base ?? p.dock} />
                  <StatRow k="Navigation" v={p.navigation} />
                  <StatRow k="Suction" v={p.suction} />
                  <StatRow k="Mop type" v={p.mopType} />
                </div>
                <div className="flex items-end justify-end sm:col-span-2">
                  <div className="flex flex-col items-end gap-2">
                    <a href={p.buyUrl ?? "#"} className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black">
                      Buy
                    </a>
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

export default async function Page() {
  const { premium = [], performance = [], budget = [] } = (await getProducts()) as any;
  const winners = [premium?.[0], performance?.[0], budget?.[0]].filter(Boolean);

  return (
    <main className="min-h-screen bg-white">
      {/* NEW: top section per screenshot */}
      <HeaderFromDesign />

      {/* Below: unchanged sections (we'll refine in later steps) */}
      <section className="bg-slate-50/50">
        <TLDRWinners winners={winners} />
        <BandList title="Premium" items={premium} anchor="premium" />
        <BandList title="Performance" items={performance} anchor="performance" />
        <BandList title="Budget" items={budget} anchor="budget" />
        <section id="compare" className="mx-auto max-w-6xl px-4 pt-8 pb-24">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Compare</h2>
            <a href="#top" className="text-sm font-medium text-slate-700 hover:text-slate-900">Back to top ↑</a>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <CompareInline />
          </div>
        </section>
      </section>

      <CompareBar />
    </main>
  );
}
