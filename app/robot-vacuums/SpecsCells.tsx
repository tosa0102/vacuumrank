// app/robot-vacuums/SpecsCells.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Offers } from "@/app/lib/serpapi";

type SpecPayload = {
  base?: string;
  navigation?: string;
  suction?: string;
  mopType?: string;
  sourceUrl?: string;
  // nya, korta “snippets” (3–4 rader med 4–7 ord/rad)
  baseDetails?: string[];
  navigationDetails?: string[];
  suctionDetails?: string[];
  mopTypeDetails?: string[];
};

function TitleWithInfo({ title, source }: { title: string; source?: string }) {
  const domain = source ? new URL(source).hostname.replace(/^www\./, "") : undefined;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </span>
      {domain && (
        <span
          title={`Source: ${domain}`}
          aria-label={`Source: ${domain}`}
          className="text-[11px] leading-none text-slate-500 select-none"
        >
          ⓘ
        </span>
      )}
    </div>
  );
}

function formatSuction(v?: string | number): string | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const s = String(v).trim();
  if (/\bpa\b/i.test(s)) return s.replace(/\bpa\b/i, "Pa");
  const digits = s.replace(/[^\d.]/g, "");
  return digits ? `${digits} Pa` : s;
}

function Lines({ main, extras }: { main?: string; extras?: string[] }) {
  if (!main && (!extras || extras.length === 0)) return <>–</>;
  const rows = [main, ...(extras ?? [])].filter(Boolean) as string[];
  // Klipp till max 4 rader för kompakt layout
  const limited = rows.slice(0, 4);
  return (
    <div className="mt-1 text-[13px] font-medium text-slate-900 leading-5 whitespace-pre-line">
      {limited.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}

function StatBlock({
  title,
  source,
  main,
  extras,
  long = false,
}: {
  title: string;
  source?: string;
  main?: string;
  extras?: string[];
  long?: boolean;
}) {
  return (
    <div className={"min-w-0 " + (long ? "md:min-h-[80px]" : "")}>
      <TitleWithInfo title={title} source={source} />
      <Lines main={main} extras={extras} />
    </div>
  );
}

type Props = {
  product: { brand?: string; model?: string; name?: string };
  offers?: Offers;
};

export default function SpecsCells({ product, offers }: Props) {
  const [data, setData] = useState<SpecPayload>();

  const hintUrls = useMemo(() => {
    const v = offers?.vendors ?? {};
    return [v?.currys?.url, v?.argos?.url, v?.ao?.url].filter(Boolean) as string[];
  }, [offers]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch("/api/specs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...product, hintUrls }),
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as SpecPayload;
        if (!cancelled) setData(json);
      } catch {
        // låt UI visa "–"
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [product?.brand, product?.model, product?.name, hintUrls.join("|")]);

  return (
    <>
      <StatBlock
        title="Base"
        source={data?.sourceUrl}
        main={data?.base}
        extras={data?.baseDetails}
        long
      />
      <StatBlock
        title="Navigation"
        source={data?.sourceUrl}
        main={data?.navigation}
        extras={data?.navigationDetails}
        long
      />
      <StatBlock
        title="Suction"
        source={data?.sourceUrl}
        main={formatSuction(data?.suction)}
        extras={data?.suctionDetails}
      />
      <StatBlock
        title="Mop type"
        source={data?.sourceUrl}
        main={data?.mopType}
        extras={data?.mopTypeDetails}
        long
      />
    </>
  );
}
