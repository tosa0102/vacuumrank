import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export default function CategoryCard({
  href, title, subtitle, Icon,
}: { href: string; title: string; subtitle?: string; Icon: LucideIcon }) {
  return (
    <Link href={href} className="card p-5 hover:shadow-md transition flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
        <Icon className="w-6 h-6 text-gray-700" />
      </div>
      <div className="flex-1">
        <div className="text-lg font-semibold">{title}</div>
        {subtitle ? <div className="text-sm text-gray-600">{subtitle}</div> : null}
      </div>
      <div className="text-sm text-gray-500">Browse →</div>
    </Link>
  );
}
