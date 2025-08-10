export const metadata = { title: "Search — RankPilot" };

const INDEX = [
  { title: "Robot vacuums (UK)", href: "/uk/robot-vacuums", tags: ["robots","vacuum","uk"] },
  { title: "Cordless vacuums (UK)", href: "/uk/cordless-vacuums", tags: ["vacuum","cordless","stick","uk"] },
  { title: "Dishwashers (UK)", href: "/uk/dishwashers", tags: ["dishwasher","uk"] },
  { title: "Robot lawn mowers (UK)", href: "/uk/robot-lawn-mowers", tags: ["mower","garden","uk"] },
  { title: "Soundbars (UK)", href: "/uk/soundbars", tags: ["soundbar","audio","tv","uk"] },
  { title: "UK robot vacuum guide", href: "/uk/best-robot-vacuum-2025", tags: ["guide","article","robots","vacuum"] },
];

export default function Page({ searchParams }: { searchParams: { q?: string }}) {
  const q = (searchParams.q ?? "").toLowerCase().trim();
  const results = q ? INDEX.filter(i => (i.title+" "+i.tags.join(" ")).toLowerCase().includes(q)) : INDEX;

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">Search</h1>
      {q ? <p className="text-gray-600">Results for “{q}”</p> : <p className="text-gray-600">Popular searches</p>}
      <ul className="grid gap-2">
        {results.map((r, i) => (
          <li key={i} className="rounded-xl border p-4 hover:shadow-md transition">
            <a href={r.href} className="font-medium">{r.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
