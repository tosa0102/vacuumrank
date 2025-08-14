// app/robot-vacuums/page.tsx — TOP SECTION (clean + stable)
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import { getProducts } from "@/app/lib/products";
import { fetchShoppingOffers } from "@/app/lib/serpapi";

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
const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

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

// ——— REST OF PAGE (SerpAPI images + price-on-buttons; tighter spacing) ———
function ProductImage({ src, alt }: { src?: string; alt: string }) {
  // Om vi har en lokal/whitelistad bild → använd Next/Image
  if (src && (src.startsWith("/") || src.includes("m.media-amazon.com"))) {
    return (
      <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-white">
        <Image src={src} alt={alt} fill className="object-contain p-2" sizes="112px" />
      </div>
    );
  }
  // Annars fallback till vanlig <img> (ingen domain-whitelist krävs)
  if (src) {
    return (
      <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-full w-full object-contain p-2" />
      </div>
    );
  }
  // Placeholder
  return <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-slate-100" />;
}

function StatCell({
  title,
  value,
  long = false,
}: {
  title: string;
  value?: string | number;
  long?: boolean; // ger plats för 3–4 rader
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      <div
        className={
          "mt-1 text-[13px] font-medium text-slate-900 break-words " +
          (long ? "whitespace-pre-line leading-5 min-h-[72px] md:min-h-[80px]" : "leading-5")
        }
      >
        {value ?? "–"}
      </div>
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
    <aside className="rounded-2xl border border-slate-200 bg-white p-3 md:p-4">
      <div className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[12px] font-semibold text-slate-700">
        Ranking
      </div>
      <div className="grid grid-cols-4 gap-2 text-[13px] md:text-sm">
        <div className="text-slate-600">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Spec</div>
          <div className="font-medium">{spec ?? "–"}</div>
        </div>
        <div className="text-slate-600">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Review</div>
          <div className="font-medium">{review ?? "–"}</div>
        </div>
        <div className="text-slate-600">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Value</div>
          <div className="font-medium">{value ?? "–"}</div>
        </div>
        <div className="text-slate-900">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Overall</div>
          <div className="text-[15px] font-semibold md:text-base">{overall ?? "–"}</div>
        </div>
      </div>
      <div className="mt-2 text-[12px] text-slate-600">
        <span className="font-medium">Ranking (previous)</span>{" "}
        <span>{overall ? "1" : "–"} {prevRank ? `(${prevRank})` : ""}</span>
      </div>
    </aside>
  );
}

// Hjälpare: bygg CTA-knappar med pris
function retailButtons(p: any, offers?: import("@/app/lib/serpapi").Offers) {
  const q = encodeURIComponent(p?.name ?? "");
  const v = offers?.vendors ?? {};
  const buttons: { label: string; href: string }[] = [];

  const add = (vendor: "amazon" | "currys" | "argos" | "ao", label: string, fallback: string) => {
    const url = v[vendor]?.url ?? fallback;
    const price = v[vendor]?.price;
    const priceTxt = typeof price === "number" ? ` ${GBP.format(price)}` : "";
    buttons.push({ label: `${label}${priceTxt}`, href: url });
  };

  add("amazon", "Amazon", `https://www.amazon.co.uk/s?k=${q}`);
  add("currys", "Currys", `https://www.currys.co.uk/search?q=${q}`);
  add("argos", "Argos", `https://www.argos.co.uk/search/${q}/`);
  add("ao", "AO", `https://ao.com/l/search?search=${q}`);

  return buttons;
}

type Enriched = { id?: string; name?: string; image?: string; [k: string]: any };

function BandList({
  items,
  anchor,
  bandLabel,
  offersByName,
  imagesByName,
}: {
  items: Enriched[];
  anchor: string;
  bandLabel: string;
  offersByName: Map<string, import("@/app/lib/serpapi").Offers>;
  imagesByName: Map<string, string | undefined>;
}) {
  return (
    <section id={anchor} className="mx-auto max-w-6xl px-4 pt-3 pb-1">
      {/* "Go to Compare" borttagen */}
      <ol className="space-y-3 md:space-y-3.5">
        {items.map((p, idx) => {
          const nameKey = p.name ?? "";
          const offers = offersByName.get(nameKey);
          const dynImage = imagesByName.get(nameKey);
          const displayImage = p.image || dynImage;

          return (
            <li
              key={p.id ?? idx}
              className="relative rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:p-4"
            >
              <span className="absolute -top-2 left-4 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                {bandLabel} <span className="text-slate-500">#{idx + 1}</span>
              </span>

              <div className="grid gap-4 md:grid-cols-12">
                {/* Vänster: bild + namn + info + CTAs */}
                <div className="md:col-span-8 lg:col-span-9">
                  <div className="flex items-start gap-5">
                    <ProductImage src={displayImage} alt={p.name ?? "Robot vacuum"} />

                    <div className="min-w-0 w-full">
                      <h3 className="truncate text-[17px] font-semibold text-slate-900 md:text-lg">
                        {p.name ?? "Model"}
                      </h3>

                      {/* Info-rad under namn */}
                      <div className="mt-1 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                        <StatCell title="Price" value={p.price ?? p.priceText} />
                        <StatCell title="Base" value={p.base ?? p.dock} long />
                        <StatCell title="Navigation" value={p.navigation} long />
                        <StatCell title="Suction" value={p.suction} />
                        <StatCell title="Mop type" value={p.mopType} long />
                      </div>

                      {/* CTA-knappar m/priser */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {retailButtons(p, offers).map((link) => (
                          <a
                            key={link.label}
                            href={link.href}
                            rel="nofollow sponsored noopener"
                            target="_blank"
                            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                          >
                            Buy at {link.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Höger: Ranking-panel */}
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
          );
        })}
      </ol>
    </section>
  );
}

export default async function Page() {
  const { premium = [], performance = [], budget = [] } = (await getProducts()) as any;

  // 1) Bygg upp unik lista med namn att slå upp
  const uniqueNames = Array.from(
    new Set([...premium, ...performance, ...budget].map((p: any) => p?.name).filter(Boolean))
  ) as string[];

  // 2) Hämta offers (priser + thumbnail) via SerpAPI parallellt (cache 6 h)
  const results = await Promise.allSettled(uniqueNames.map((n) => fetchShoppingOffers(n)));

  // 3) Mappa tillbaka till name → offers / image
  const offersByName = new Map<string, import("@/app/lib/serpapi").Offers>();
  const imagesByName = new Map<string, string | undefined>();
  uniqueNames.forEach((name, i) => {
    const r = results[i];
    if (r.status === "fulfilled" && r.value) {
      offersByName.set(name, r.value);
      if (r.value.image) imagesByName.set(name, r.value.image);
    }
  });

  return (
    <main className="min-h-screen bg-white">
      {/* Top section */}
      <HeaderFromDesign />

      {/* Lists — tighter spacing, bilder via SerpAPI, knappar med priser */}
      <section className="bg-slate-50/50">
        <BandList
          items={premium}
          anchor="premium"
          bandLabel="Premium"
          offersByName={offersByName}
          imagesByName={imagesByName}
        />
        <BandList
          items={performance}
          anchor="performance"
          bandLabel="Performance"
          offersByName={offersByName}
          imagesByName={imagesByName}
        />
        <BandList
          items={budget}
          anchor="budget"
          bandLabel="Budget"
          offersByName={offersByName}
          imagesByName={imagesByName}
        />

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
