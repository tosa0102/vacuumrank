"use client";
import React from "react";

type Prod = {
  name: string;
  image?: string;
  suction?: number | string;
  mopType?: string;
  dock?: string;      // eller 'base'
  base?: string;
  navigation?: string;
  edgeTools?: string;
  reviewStars?: number | string;
  specScore?: number | string;
  priceValue?: number; // numeriskt pris för jämförelse
  price?: string;      // visning "~£999"
};

export default function CompareInline({ items = [] as Prod[] }) {
  // Normalisera 'base' → 'dock' så tabellen får samma label
  const prods = items.map(p => ({ ...p, dock: p.dock ?? p.base }));

  const rows: {
    key: keyof Prod;
    label: string;
    winner: "max" | "min" | null;
    display?: (v: any, p: Prod) => React.ReactNode;
  }[] = [
    { key: "suction",     label: "Suction (Pa)", winner: "max" },
    { key: "mopType",     label: "Mop",          winner: null },
    { key: "dock",        label: "Dock",         winner: null },
    { key: "navigation",  label: "Navigation",   winner: null },
    { key: "edgeTools",   label: "Edge tools",   winner: null },
    { key: "reviewStars", label: "Review Stars", winner: "max" },
    { key: "specScore",   label: "Spec Score",   winner: "max" },
    { key: "priceValue",  label: "Street price", winner: "min", display: (_: any, p: Prod) => p.price ?? "–" },
  ];

  function getWinners(rowKey: keyof Prod, mode: "max" | "min" | null) {
    if (!mode) return new Set<number>();
    const nums = prods.map(p => {
      const v = p[rowKey];
      return typeof v === "string" ? Number(String(v).replace(/[^0-9.]/g, "")) : (v as number);
    });
    const best = mode === "max" ? Math.max(...nums) : Math.min(...nums);
    const winners = new Set<number>();
    nums.forEach((n, i) => { if (Number.isFinite(best) && n === best) winners.add(i); });
    return winners;
    }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-left text-slate-600">
            <th className="sticky left-0 z-[1] bg-white/90 px-3 py-2 font-medium">Comparison</th>
            {prods.map((p, i) => (
              <th key={i} className="px-3 py-2 font-semibold text-slate-900">{p.name ?? `Item ${i+1}`}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => {
            const winners = getWinners(row.key, row.winner);
            return (
              <tr key={r} className="odd:bg-slate-50/60">
                <th className="sticky left-0 z-[1] bg-inherit px-3 py-2 text-slate-700 font-medium">
                  {row.label}
                </th>
                {prods.map((p, i) => {
                  const raw = p[row.key];
                  const content = row.display ? row.display(raw, p) : (raw ?? "–");
                  const isWinner = winners.has(i);
                  return (
                    <td
                      key={i}
                      className={
                        "px-3 py-2 align-middle" +
                        (isWinner ? " bg-emerald-50 ring-1 ring-emerald-200 rounded" : "")
                      }
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">Bästa värdet per rad markeras subtilt. Pris jämförs numeriskt via <code>priceValue</code>.</p>
    </div>
  );
}

