'use client';

import { useEffect, useMemo, useState } from 'react';

type Band = 'premium' | 'performance' | 'budget';
type Scores = { spec: number; review?: number; value: number; overall: number; prevRank?: number };
type Product = {
  id: string; name: string; band: Band;
  price?: number; price_gbp?: number;
  base?: string; navigation?: string; suction_pa?: number; mop_type?: string;
  scores: Scores; image?: string;
};

const KEY = 'rp_compare_robotvacuums';

function readIds(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

function bestIdx(vals: (number|undefined)[], preferHigh: boolean) {
  const norm = vals.map(v => typeof v === 'number' ? v : (preferHigh ? -Infinity : Infinity));
  const best = preferHigh ? Math.max(...norm) : Math.min(...norm);
  if (!isFinite(best)) return new Set<number>();
  return new Set(norm.map((v,i)=>v===best?i:-1).filter(i=>i>=0));
}

export default function CompareInline({ products, currencyCode }:{ products: Product[]; currencyCode: string }) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(readIds());
    const onChange = () => setIds(readIds());
    window.addEventListener('compare:changed', onChange as any);
    return () => window.removeEventListener('compare:changed', onChange as any);
  }, []);

  const items = useMemo(() => {
    const map = new Map(products.map(p=>[p.id, p]));
    return ids.map(id=>map.get(id)).filter(Boolean) as Product[];
  }, [ids, products]);

  const fmtCurrency = (v?: number) =>
    (v===undefined || v===null) ? '—'
    : new Intl.NumberFormat(undefined, { style:'currency', currency: currencyCode }).format(v);

  const downloadCSV = () => {
    if (!items.length) return;
    const header = ['Name','Band','Price','Base','Navigation','Suction(Pa)','Mop type','Spec','Review','Value','Overall','PrevRank'];
    const rows = items.map(p => [
      p.name, p.band,
      (p.price_gbp ?? p.price) ?? '',
      p.base ?? '', p.navigation ?? '', p.suction_pa ?? '',
      p.mop_type ?? '',
      p.scores?.spec ?? '', p.scores?.review ?? '', p.scores?.value ?? '',
      p.scores?.overall ?? '', p.scores?.prevRank ?? ''
    ]);
    const csv = [header, ...rows].map(r => r.map(x=>String(x).replaceAll('"','""')).map(x=>`"${x}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'robot-vacuums-compare.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Highlights
  const priceVals = items.map(p => p.price_gbp ?? p.price);
  const priceBest = bestIdx(priceVals, false); // lägst pris bäst
  const specBest = bestIdx(items.map(p=>p.scores?.spec), true);
  const reviewBest = bestIdx(items.map(p=>p.scores?.review), true);
  const valueBest = bestIdx(items.map(p=>p.scores?.value), true);
  const overallBest = bestIdx(items.map(p=>p.scores?.overall), true);

  return (
    <section id="compare" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Compare</h2>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Download CSV</button>
          <a href="#top" className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Back to top</a>
        </div>
      </div>

      {!items.length ? (
        <div className="rounded-xl border p-6 text-gray-700">
          No models selected. On the list above, click <strong>Add to Compare</strong> on up to three models — your selection appears here.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <div className="grid" style={{gridTemplateColumns:`220px repeat(${items.length}, minmax(220px,1fr))`}}>
            <div className="px-3 py-3 border font-semibold bg-gray-50"> </div>
            {items.map((p,i)=>(
              <div key={i} className="px-3 py-3 border bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-white overflow-hidden flex items-center justify-center border">
                    <img src={p.image || `https://placehold.co/120x120?text=${encodeURIComponent(p.name.slice(0,18))}`} alt={p.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="font-medium leading-snug">{p.name}</div>
                </div>
              </div>
            ))}

            {/* Rows */}
            <div className="px-3 py-2 border bg-white font-medium">Price</div>
            {items.map((p,i)=>(
              <div key={'pr'+i} className={`px-3 py-2 border ${priceBest.has(i)?'bg-yellow-50 font-medium':''}`}>
                {fmtCurrency(p.price_gbp ?? p.price)}
              </div>
            ))}

            <div className="px-3 py-2 border bg-white font-medium">Base</div>
            {items.map((p,i)=><div key={'b'+i} className="px-3 py-2 border">{p.base ?? '—'}</div>)}

            <div className="px-3 py-2 border bg-white font-medium">Navigation</div>
            {items.map((p,i)=><div key={'n'+i} className="px-3 py-2 border">{p.navigation ?? '—'}</div>)}

            <div className="px-3 py-2 border bg-white font-medium">Suction (Pa)</div>
            {items.map((p,i)=><div key={'s'+i} className={`px-3 py-2 border ${ (typeof p.suction_pa==='number' && overallBest.size===0) ? '' : '' } ${ /* highlight separately if you vill */ ''}`}>{p.suction_pa ?? '—'}</div>)}

            <div className="px-3 py-2 border bg-white font-medium">Mop type</div>
            {items.map((p,i)=><div key={'m'+i} className="px-3 py-2 border">{p.mop_type ?? '—'}</div>)}

            <div className="px-3 py-2 border bg-white font-medium">Spec</div>
            {items.map((p,i)=><div key={'sp'+i} className={`px-3 py-2 border ${specBest.has(i)?'bg-yellow-50 font-medium':''}`}>{p.scores?.spec?.toFixed?.(2) ?? '—'}</div>)}

            <div className="px-3 py-2 border bg-white font-medium">Review</div>
            {items.map((p,i)=><div key={'rv'+i} className={`px-3 py-2 border ${reviewBest.has(i)?'bg-yellow-50 font-medium':''}`}>{p.scores?.review?.toFixed?.(2) ?? '—'}</div>)}

            <div className="px-3 py-2 border bg-white font-medium">Value</div>
            {items.map((p,i)=><div key={'va'+i} className={`px-3 py-2 border ${valueBest.has(i)?'bg-yellow-50 font-medium':''}`}>{p.scores?.value?.toFixed?.(2) ?? '—'}</div>)}

            <div className="px-3 py-2 border bg-white font-medium">Overall</div>
            {items.map((p,i)=><div key={'ov'+i} className={`px-3 py-2 border ${overallBest.has(i)?'bg-yellow-50 font-medium':''}`}>{p.scores?.overall?.toFixed?.(2) ?? '—'}</div>)}

            <div className="px-3 py-2 border bg-white font-medium">Prev rank</div>
            {items.map((p,i)=><div key={'prv'+i} className="px-3 py-2 border">{p.scores?.prevRank ? `#${p.scores.prevRank}` : '—'}</div>)}
          </div>
        </div>
      )}
    </section>
  );
}
