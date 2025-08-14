// app/robot-vacuums/SpecsCells.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Offers } from "@/app/lib/serpapi";

function ValueWithSource({ value, source }: { value?: string | number; source?: string }) {
  if (value == null || value === "") return <>–</>;
  const domain = source ? new URL(source).hostname.replace(/^www\./, "") : undefined;
  return (
    <span className="inline-flex items-center gap-1">
      <span>{value}</span>
      {domain && (
        <span
          title={`Source: ${domain}`}
          aria-label={`Source: ${domain}`}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] leading-none text-slate-500"
        >
          ⓘ
        </span>
      )}
    </span>
  );
}

function formatSuction(v?: string | number): string | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const s = String(v).trim();
  if (/\bpa\b/i.test(s)) return s.replace(/\bpa\b/i, "Pa");
  const digits = s.replace(/[^\d.]/g, "");
  return digits ? `${digits} Pa` : s;
}

export function StatCell({ title, value, long = false }: { title: string; value?: React.ReactNode; long?: boolean }) {
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

type Props = {
  product: { brand?: string; model?: string; name?: string };
  offers?: Offers;
};

export default function SpecsCells({ product, offers }: Props) {
  const [data, setData] = useState<{ base?: string; navigation?: string; suction?: string; mopType?: string; sourceUrl?: string }>();

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
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // tyst fel; vi låter UI visa "–"
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [product?.brand, product?.model, product?.name, hintUrls.join("|")]);

  return (
    <>
      <StatCell title="Base" value={<ValueWithSource value={data?.base} source={data?.sourceUrl} />} long />
      <StatCell title="Navigation" value={<ValueWithSource value={data?.navigation} source={data?.sourceUrl} />} long />
      <StatCell title="Suction" value={<ValueWithSource value={formatSuction(data?.suction)} source={data?.sourceUrl} />} />
      <StatCell title="Mop type" value={<ValueWithSource value={data?.mopType} source={data?.sourceUrl} />} long />
    </>
  );
}
