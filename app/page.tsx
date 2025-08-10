import Link from "next/link";
import CategoryCard from "../components/CategoryCard";
import SearchBox from "../components/SearchBox";
import { Home, Sprout, Cpu, Smartphone, Tv } from "lucide-react";

export const metadata = {
  title: "RankPilot — Expert product rankings",
  description: "Best-in-test style rankings with local pricing and availability.",
};

export default function Page() {
  const cats = [
    { href: "/uk/robot-vacuums", title: "Robot vacuums", subtitle: "Premium • Performance • Budget", Icon: Home },
    { href: "/uk/cordless-vacuums", title: "Cordless vacuums", subtitle: "Dyson, Shark, Samsung and more", Icon: Home },
    { href: "/uk/dishwashers", title: "Dishwashers", subtitle: "Quiet, efficient, third rack", Icon: Home },
    { href: "/uk/robot-lawn-mowers", title: "Robot lawn mowers", subtitle: "Wire vs RTK, slope, area", Icon: Sprout },
    { href: "/uk/soundbars", title: "Soundbars", subtitle: "Dolby Atmos, eARC, room correction", Icon: Tv },
    { href: "/uk", title: "All rankings", subtitle: "See the index", Icon: Cpu },
    { href: "/uk/best-robot-vacuum-2025", title: "Robot vacuum guide", subtitle: "Our full best-in-test write-up", Icon: Smartphone },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": cats.map((c, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": c.href,
      "name": c.title
    }))
  };

  return (
    <div className="grid gap-8">
      {/* Hero */}
      <section className="text-center grid gap-4">
        <h1 className="text-3xl font-bold">Find the best products — ranked for your needs</h1>
        <p className="text-gray-600">We combine live street pricing, features, and verified reviews.</p>
        <div className="mx-auto"><SearchBox /></div>
      </section>

      {/* Categories */}
      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">Browse categories</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map((c, i) => (<CategoryCard key={i} {...c} />))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
