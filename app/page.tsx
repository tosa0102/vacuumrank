
import Link from "next/link";
export default function Page() {
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">Best Robot Vacuums by Country</h1>
      <p className="text-gray-600">We combine live street pricing, feature scoring, and verified reviews — updated monthly.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/uk" className="card p-6 hover:shadow-md transition">
          <div className="text-sm uppercase text-gray-500">Start here</div>
          <div className="text-xl font-semibold">United Kingdom</div>
          <div className="mt-2 text-gray-600">Premium • Performance • Budget</div>
        </Link>
      </div>
    </div>
  );
}
