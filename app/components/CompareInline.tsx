"use client";

import React from "react";

// ——— Types (loose to fit existing data) ———
export type Prod = {
  id?: string;
  name: string;
  image?: string;
  suction?: number | string;
  mopType?: string;
  dock?: string; // normalized from base
  base?: string;
  navigation?: string;
  edgeTools?: string;
  reviewStars?: number | string;
  specScore?: number | string;
  price?: string; // display
  priceValue?: number | string; // numeric for comparison
};

// Try a few common localStorage keys, but allow props override
const LOCAL_KEYS = [
  "rankpilot.compare",
  "compareItems",
  "compare",
];

function readLocalCompare(): Prod[] {
  if (typeof window === "undefined") return [];
  for (const k of LOCAL_KEYS) {
    try {
      const raw = window.localStorage.getItem(k);
      if (!raw) continue;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr as Prod[];
    } catch {}
  }
  return [];
}

function toNumberLike(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function normalize(items: Prod[]): Prod[] {
  return (items || []).map((p) => ({
    ...p,
    dock: p.dock ?? p.base,
    // ensure priceValue numeric if possible
    priceValue: toNumberLike(p.priceValue) ?? toNumberLike(p.price),
  }));
}

export default function CompareInline({ items }: { items?: Prod[] }) {
  const [stateItems, setStateItems] = React.useState<Prod[]>([]);

  // Load from localStorage on mount if no props provided
  React.useEffect(() => {
    if (!items || items.length === 0) {
      setStateItems(normalize(readLocalCompare()).slice(0, 3));
    }
  }, [items]);

  // Sync when localStorage changes (another tab / CompareToggle)
  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (!LOCAL_KEYS.includes(e.key || "")) return;
      setStateItems(normalize(readLocalCompare()).slice(0, 3));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const prods = normalize((items && items.length ? items : stateItems).slice(0, 3));

  const rows: {
    key: keyof Prod;
    label: string;
    winner: "max" | "min" | null;
    display?: (v: any, p: Prod) => React.ReactNode;
  }[] = [
    { key: "suction", label: "Suction (Pa)", winner: "max" },
    { key: "mopType", label: "Mop", winner: null },
    { key: "dock", label: "Dock", winner: null },
    { key: "navigation", label: "Navigation", winner: null },
    { key: "edgeTools", label: "Edge tools", winner: null },
    { key: "reviewStars", label: "Review Stars", winner: "max" },
    { key: "specScore", label: "Spec Score", winner: "max" },
    { key: "priceValue", label: "Street price", winner: "min", display: (_: any, p: Prod) => p.price ?? "–" },
  ];

  function getWinners(rowKey: keyof Prod, mode: "max" | "min" | null) {
    if (!mode) return new Set<number>();
    const nums = prods.map((p) => toNumberLike(p[rowKey] as any));
    const valid = nums.filter((n) => typeof n === "number") as number[];
    if (!valid.length) return new Set<number>();
    const best = mode === "max" ? Math.max(...valid) : Math.min(...valid);
    const winners = new Set<number>();
    nums.forEach((n, i) => {
      if (typeof n === "number" && n === best) winners.add(i);
    });
    return winners;
  }

  function downloadCSV() {
    const headers = ["Metric", ...prods.map((p, i) => p.name || `Item ${i + 1}`)];
    const lines: string[][] = [headers];
    rows.forEach((row) => {
      const val = prods.map((p) => {
        const raw = (p as any)[row.key];
        const out = row.display ? row.display(raw, p) : raw;
        return typeof out === "string" ? out : String(out ?? "-");
      });
      lines.push([row.label, ...val]);
    });
    const csv = lines
      .map((r) => r.map((c) => (c.includes(",") || c.includes("\n") ? `"${c.replace(/"/g, '""')}"` : c)).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compare.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!prods.length) {
    return (
      <div className="flex flex-col items-center gap-2 p-8 text-center text-slate-600">
        <p>Add up to 3 products to compare.</p>
        <button
          type="button"
          onClick={downloadCSV}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Download CSV (empty)
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={downloadCSV}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Download CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="sticky left-0 z-[1] bg-white/90 px-3 py-2 font-medium">Comparison</th>
              {prods.map((p, i) => (
                <th key={i} className="px-3 py-2 font-semibold text-slate-900">{p.name ?? `Item ${i + 1}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => {
              const winners = getWinners(row.key, row.winner);
              return (
                <tr key={r} className="odd:bg-slate-50/60">
                  <th className="sticky left-0 z-[1] bg-inherit px-3 py-2 font-medium text-slate-700">{row.label}</th>
                  {prods.map((p, i) => {
                    const raw = (p as any)[row.key];
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
      </div>
      <p className="mt-2 text-xs text-slate-500">Rows are zebra-striped for readability. Best value per row is highlighted; lower price wins.</p>
    </div>
  );
}
