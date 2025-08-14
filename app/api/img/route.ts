// app/api/img/route.ts
import { NextResponse } from "next/server";

export const revalidate = 86_400; // 24h cache

export async function GET(req: Request) {
  const u = new URL(req.url);
  const target = u.searchParams.get("u");
  if (!target) return NextResponse.json({ error: "Missing u" }, { status: 400 });

  try {
    // Hämta bilden och returnera den som bytes
    const res = await fetch(target, { next: { revalidate } as any });
    if (!res.ok) return NextResponse.json({ error: "Upstream error" }, { status: 502 });

    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") || "image/jpeg";
    return new NextResponse(buf, {
      headers: {
        "content-type": ct,
        "cache-control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
