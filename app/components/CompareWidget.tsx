'use client';

import { useMemo, useState } from "react";

type P = any;

export default function CompareWidget({ products }: { products: P[] }) {
  const [chosen, setChosen] = useState<string[]>([]);

  const id = (p: P) => (p.id || p.gtin_ean || `${p.brand || ""}-${p.model || p.name || ""}`);
  const label = (p: P) => p.name || [p.brand, p.model].filter(Boolean).join(" ");

  const options = products.map(p => ({ id: id(p), label: label(p) }));

  function toggle(idVal: string) {
    setChosen(prev => {
      const on = prev.includes(idVal);
      if (on) return prev.filter(x => x !== idVal);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, idVal];
    });
  }

  const selected = useMemo(() => products.filter(p => chosen.includes(id(p))), [chosen, products]);

  // Keys to show in table
  const keys: Array<{k:string; label:string}> = [
    { k: "suction_pa", label: "Suction (Pa)" },
    { k: "mop_type", label: "Mop" },
    { k: "dock", label: "Dock" },
    { k: "navigation", label: "Navigation" },
    { k: "edge_tools", label: "Edge tools" },
    { k: "price_gbp", label: "Street price" },
  ];

  return (
    <div className="grid gap-3">
      <div className="text-sm text-gray-600">Pick up to 3 models to compare:</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {options.map(opt => (
          <label key={opt.id} className="rounded-xl border px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              className="accent-gray-700"
              checked={chosen.includes(opt.id)}
              onChange={() => toggle(opt.id)}
            />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border rounded-xl">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left">Spec</th>
                {selected.map((p) => (
                  <th key={id(p)} className="p-2 text-left">{label(p)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map(({k, label: lab}) => (
                <tr key={k} className="border-t">
                  <td className="p-2 font-medium">{lab}</td>
                  {selected.map((p) => (
                    <td key={id(p)+k} className="p-2">{p[k] ?? "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
