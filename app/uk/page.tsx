
'use client';
import { useMemo, useState } from "react";
import premiumData from "../../data/uk-premium.json";
import perfData from "../../data/uk-performance.json";
import budgetData from "../../data/uk-budget.json";
import { ChevronsUpDown, Plus } from "lucide-react";

type Model = {
  brand: string; model: string; price_gbp: number; suction_pa: number|null;
  mop_type: string; dock: string; navigation: string; edge_tools?: boolean;
  spec: number; value: number; review_stars: number|null; review_count: number|null; review_score: number|null;
  overall: number; band: string;
};

const bands: Record<string, {label: string; desc: string;}> = {
  premium: { label: "Premium (≥ £900)", desc: "Hands-off docks + top features" },
  performance: { label: "Performance (£400–£899)", desc: "Most features for the money" },
  budget: { label: "Budget (≤ £399)", desc: "Essentials + great value" },
};

function scoreBadge(n:number|undefined|null) {
  if (n == null) return <span className="badge">—</span>;
  let color = "bg-gray-100 text-gray-800";
  if (n >= 9) color = "bg-green-600 text-white";
  else if (n >= 8) color = "bg-green-500 text-white";
  else if (n >= 7) color = "bg-amber-500 text-white";
  else color = "bg-gray-300 text-gray-800";
  return <span className={`badge ${color}`}>{n.toFixed(2)}</span>;
}

function Table({ data, onCompareToggle, selected }:{data:Model[], onCompareToggle:(m:Model)=>void, selected:Model[]}){
  const [sortKey, setSortKey] = useState<keyof Model>('overall');
  const [asc, setAsc] = useState(false);
  const sorted = useMemo(()=>{
    const kop = [...data];
    kop.sort((a,b)=>{
      const va = (a[sortKey] as any) ?? -Infinity;
      const vb = (b[sortKey] as any) ?? -Infinity;
      if (va < vb) return asc ? -1 : 1;
      if (va > vb) return asc ? 1 : -1;
      return 0;
    });
    return kop;
  }, [data, sortKey, asc]);

  function header(th:string, key: keyof Model){
    return (
      <th className="cursor-pointer" onClick={()=>{ sortKey===key? setAsc(!asc): (setSortKey(key), setAsc(false))}}>
        <div className="flex items-center gap-1">{th}<ChevronsUpDown className="w-4 h-4 opacity-60"/></div>
      </th>
    );
  }

  return (
    <div className="card p-2">
      <table>
        <thead>
          <tr>
            <th>Compare</th>
            {header("Model","model")}
            {header("Overall","overall")}
            {header("Spec","spec")}
            {header("Reviews","review_score")}
            {header("Value","value")}
            <th>Key features</th>
            {header("Price (£)","price_gbp")}
          </tr>
        </thead>
        <tbody>
          {sorted.map((m,idx)=>{
            const isSel = selected.some(s=> s.brand===m.brand && s.model===m.model);
            return (
              <tr key={idx}>
                <td>
                  <button className={`btn ${isSel? 'bg-gray-900 text-white border-gray-900':''}`} onClick={()=>onCompareToggle(m)}>
                    <Plus className="w-4 h-4"/>{isSel? 'Added':'Add'}
                  </button>
                </td>
                <td>
                  <div className="font-semibold">{m.brand} {m.model}</div>
                  <div className="text-xs text-gray-500">{m.navigation}</div>
                </td>
                <td>{scoreBadge(m.overall)}</td>
                <td>{scoreBadge(m.spec)}</td>
                <td>{scoreBadge(m.review_score ?? undefined)}</td>
                <td>{scoreBadge(m.value)}</td>
                <td className="text-sm text-gray-600">
                  Mop: {m.mop_type} · Dock: {m.dock}{m.suction_pa? ` · Suction: ${m.suction_pa}Pa`:''}
                </td>
                <td className="whitespace-nowrap">£{m.price_gbp.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
}

function Compare({ models }:{models:Model[]}){
  if (models.length===0) return null;
  const keys = ["overall","spec","review_score","value"];
  const specKeys = [
    ["suction_pa","Suction (Pa)"],
    ["mop_type","Mopping"],
    ["dock","Dock"],
    ["navigation","Navigation"],
  ] as [keyof Model,string][];
  return (
    <div className="card p-4 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Compare ({models.length}/3)</h3>
      </div>
      <div className="overflow-auto">
        <table className="mt-3 min-w-[640px]">
          <thead>
            <tr>
              <th></th>
              {models.map((m,i)=>(<th key={i}>{m.brand} {m.model}</th>))}
            </tr>
          </thead>
          <tbody>
            <tr><td className="font-semibold">Overall</td>{models.map((m,i)=>(<td key={i}>{m.overall?.toFixed(2)}</td>))}</tr>
            <tr><td className="font-semibold">Spec</td>{models.map((m,i)=>(<td key={i}>{m.spec?.toFixed(2)}</td>))}</tr>
            <tr><td className="font-semibold">Reviews</td>{models.map((m,i)=>(<td key={i}>{m.review_score!=null? m.review_score.toFixed(2):'—'}</td>))}</tr>
            <tr><td className="font-semibold">Value</td>{models.map((m,i)=>(<td key={i}>{m.value?.toFixed(2)}</td>))}</tr>
            {specKeys.map(([k,label])=>(
              <tr key={k as string}>
                <td className="font-semibold">{label}</td>
                {models.map((m,i)=>(<td key={i}>{(m as any)[k] ?? '—'}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function UKPage(){
  const [band,setBand] = useState<keyof typeof bands>('premium');
  const data = useMemo(()=>{
    if (band==='premium') return premiumData as Model[];
    if (band==='performance') return perfData as Model[];
    return budgetData as Model[];
  },[band]);

  const [compare,setCompare] = useState<Model[]>([]);
  function toggle(m:Model){
    const exists = compare.some(x=> x.brand===m.brand && x.model===m.model);
    if (exists) setCompare(compare.filter(x=> !(x.brand===m.brand && x.model===m.model)));
    else if (compare.length < 3) setCompare([...compare, m]);
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-2">
        {Object.entries(bands).map(([k,v])=>(
          <button key={k} onClick={()=>setBand(k as any)} className={`tab ${band===k?'tab-active':''}`}>{v.label}</button>
        ))}
      </div>
      <p className="text-gray-600">{bands[band].desc}. Select up to 3 models to compare.</p>
      <Table data={data} onCompareToggle={toggle} selected={compare}/>
      <Compare models={compare}/>
    </div>
    <div>
  <Link href="/uk/best-robot-vacuum-2025" className="btn mt-2">
    Read: Best Robot Vacuums 2025 (UK)
  </Link>
</div>

  );
}
