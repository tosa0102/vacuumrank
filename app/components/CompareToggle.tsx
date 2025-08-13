'use client';

import { useEffect, useMemo, useState } from 'react';

const KEY = 'rp_compare_robotvacuums';

function readIds(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function writeIds(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids.slice(0,3)));
  window.dispatchEvent(new CustomEvent('compare:changed'));
}

export default function CompareToggle({ id }:{ id:string }) {
  const [sel, setSel] = useState<string[]>([]);
  useEffect(() => {
    setSel(readIds());
    const onChange = () => setSel(readIds());
    window.addEventListener('compare:changed', onChange as any);
    return () => window.removeEventListener('compare:changed', onChange as any);
  }, []);
  const isSelected = useMemo(()=> sel.includes(id), [sel, id]);

  const toggle = () => {
    const curr = readIds();
    let next = curr.includes(id) ? curr.filter(x=>x!==id) : curr.concat(id);
    if (next.length > 3) next = next.slice(0,3);
    writeIds(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`rounded-lg border px-3 py-2 text-sm font-medium ${isSelected ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
      aria-pressed={isSelected}
    >
      {isSelected ? 'Remove from Compare' : 'Add to Compare'}
    </button>
  );
}
