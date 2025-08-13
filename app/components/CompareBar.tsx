'use client';

import { useEffect, useState } from 'react';

const KEY = 'rp_compare_robotvacuums';

function readIds(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export default function CompareBar() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(readIds());
    const onChange = () => setIds(readIds());
    window.addEventListener('compare:changed', onChange as any);
    return () => window.removeEventListener('compare:changed', onChange as any);
  }, []);

  if (!ids.length) return null;

  return (
    <div className="fixed inset-x-0 bottom-3 z-50 px-4">
      <div className="mx-auto max-w-3xl rounded-xl border bg-white shadow-md px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-700">Compare ready: <strong>{ids.length}</strong> selected</div>
        <div className="flex items-center gap-2">
          <a href="#compare" className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50">Open Compare</a>
          <button
            type="button"
            onClick={() => { localStorage.removeItem(KEY); window.dispatchEvent(new CustomEvent('compare:changed')); }}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
