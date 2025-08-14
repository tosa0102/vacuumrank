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

// ——— REST OF PAGE (TL;DR removed; banded list redesigned to match PDF) ———
function ScorePill({ label, value }: { label: string; value?: number | string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 text-xs font-medium text-slate-700">
      <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
      <span>{value ?? "–"}</span>
    </span>
  );
}

function StatCell({ title, value }: { title: string; value?: string | number }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value ?? "–"}</div>
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
    return <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-slate-100" />;
  }
  return (
    <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-white">
      <Image src={src} alt={alt} fill className="object-contain p-2" sizes="112px" />
    </div>
  );
}

function RankingPanel({
  spec,
  review,
  value,
  overall,
  prevRank,
}: {
  spec?: number | string;
  review?: number | string;
  value?: number | string;
  overall?: number | string;
  prevRank?: number | string;
}) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
        Ranking
      </div>
      <div className="grid grid-cols-4 gap-2 text-sm">
        <div className="text-slate-600">
          <div className="text-xs uppercase tracking-wide text-slate-500">Spec</div>
          <div className="font-medium">{spec ?? "–"}</div>
        </div>
        <div className="text-slate-600">
          <div className="text-xs uppercase tracking-wide text-slate-500">Review</div>
          <div className="font-medium">{review ?? "–"}</div>
        </div>
        <div className="text-slate-600">
          <div className="text-xs uppercase tracking-wide text-slate-500">Value</div>
          <div className="font-medium">{value ?? "–"}</div>
        </div>
        <div className="text-slate-900">
          <div className="text-xs uppercase tracking-wide text-slate-500">Overall</div>
          <div className="font-semibold">{overall ?? "–"}</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-slate-600">
        <span className="font-medium">Ranking (previous)</span>{" "}
        <span>{overall ? "1" : "–"} {prevRank ? `(${prevRank})` : ""}</span>
      </div>
    </aside>
  );
}

function BandList({
  title,
  items,
  anchor,
  bandLabel,
}: {
  title: string;
  items: any[];
  anchor: string;
  bandLabel?: string;
}) {
  const label = bandLabel ?? title;
  return (
    <section id={anchor} className="mx-auto max-w-6xl px-4 pt-6 pb-4">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">Top 10 in rank order</p>
        </div>
        <a href="#compare" className="text-sm font-medium text-slate-700 hover:text-slate-900">
          Go to Compare →
        </a>
      </div>

      <ol className="space-y-4">
        {items.map((p: any, idx: number) => (
          <li key={p.id ?? idx} className="relative rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            {/* Liten band-etikett uppe till vänster: "Premium #1" */}
            <span className="absolute -top-3 left-4 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
              {label} <span className="text-slate-500">#{idx + 1}</span>
            </span>

            <div className="grid gap-4 md:grid-cols-12">
              {/* Vänster: rank-siffra + bild + namn/pris/cta */}
              <div className="md:col-span-8 lg:col-span-9">
                <div className="flex items-start gap-4">
                  <RankBadge n={idx + 1} />
                  <ProductImage src={p.image} alt={p.name ?? "Robot vacuum"} />
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-slate-900">
                      {p.name ?? "Model"}
                    </h3>
                    {p.price && (
                      <div className="mt-1 text-sm text-slate-600">~{p.price}</div>
                    )}

                    {/* Feature-raden: Price / Base / Navigation / Suction / Mop type */}
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                      <StatCell title="Price" value={p.price ?? p.priceText} />
                      <StatCell title="Base" value={p.base ?? p.dock} />
                      <StatCell title="Navigation" value={p.navigation} />
                      <StatCell title="Suction" value={p.suction} />
                      <StatCell title="Mop type" value={p.mopType} />
                    </div>

                    {/* CTAs */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.buyUrl && (
                        <a
                          href={p.buyUrl}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                        >
                          Buy at Amazon
                        </a>
                      )}
                      {p.brandUrl && (
                        <a
                          href={p.brandUrl}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                        >
                          Buy at Brand store
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Höger: Ranking-panelen */}
              <div className="md:col-span-4 lg:col-span-3">
                <RankingPanel
                  spec={p.scores?.spec}
                  review={p.scores?.review}
                  value={p.scores?.value}
                  overall={p.scores?.overall}
                  prevRank={p.prevRank}
                />
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

  return (
    <main className="min-h-screen bg-white">
      {/* Top section */}
      <HeaderFromDesign />

      {/* Banded lists (PDF layout) */}
      <section className="bg-slate-50/50">
        <BandList title="Premium" items={premium} anchor="premium" bandLabel="Premium" />
        <BandList title="Performance" items={performance} anchor="performance" bandLabel="Performance" />
        <BandList title="Budget" items={budget} anchor="budget" bandLabel="Budget" />

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
