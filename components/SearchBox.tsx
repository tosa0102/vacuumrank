'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

const SUGGESTIONS = [
  { title: "Robot vacuums (UK)", href: "/uk/robot-vacuums" },
  { title: "Cordless vacuums (UK)", href: "/uk/cordless-vacuums" },
  { title: "Dishwashers (UK)", href: "/uk/dishwashers" },
  { title: "Robot lawn mowers (UK)", href: "/uk/robot-lawn-mowers" },
  { title: "Soundbars (UK)", href: "/uk/soundbars" },
  { title: "UK robot vacuum guide", href: "/uk/best-robot-vacuum-2025" },
];

export default function SearchBox() {
  const r = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    r.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  const items = SUGGESTIONS.filter(s => s.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="relative w-full max-w-2xl">
      <form onSubmit={submit}>
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Search products (e.g., robot vacuum, soundbar)…"
          value={q}
          onChange={(e)=> setQ(e.target.value)}
          onFocus={()=> setOpen(true)}
          onBlur={()=> setTimeout(()=> setOpen(false), 120)}
        />
      </form>
      {open && (
        <div className="absolute z-10 mt-2 w-full rounded-xl border bg-white shadow">
          {items.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">No quick results — press Enter to search</div>
          ) : items.map((s, i) => (
            <a key={i} href={s.href} className="block px-4 py-2 hover:bg-gray-50 text-sm">{s.title}</a>
          ))}
        </div>
      )}
    </div>
  );
}
