// app/api/img/route.ts
import { NextResponse } from "next/server";

// Kör i Node-runtime så vi kan använda Buffer ordentligt
export const runtime = "nodejs";
// Tvinga dynamik (ingen statisk optimering av denna route)
export const dynamic = "force-dynamic";

// 24h cache om origin inte ger något bättre
const DEFAULT_MAX_AGE = 86_400;

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const target = u.searchParams.get("u");
    if (!target) {
      return NextResponse.json({ error: "Missing u" }, { status: 400 });
    }

    // Tillåt endast https
    if (!/^https:\/\//i.test(target)) {
      return NextResponse.json({ error: "Only https is allowed" }, { status: 400 });
    }

    // Vanliga headers som vissa origin (t.ex. Amazon) förväntar sig
    const upstreamHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept:
        "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "Accept-Language": "en-GB,en;q=0.9",
      Referer: "https://www.google.com/", // oskyldig referer brukar lugna många CDNs
      // Ingen Authorization/cookie vidarebefordran
    };

    // Följ redirects
    const res = await fetch(target, {
      redirect: "follow",
      // Låt Next cacha svaret, men respektera headers nedan
      next: { revalidate: DEFAULT_MAX_AGE } as any,
      headers: upstreamHeaders,
    });

    // Om origin svarar fel, bubbla upp kod (men inte hela html-sidan)
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }

    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    // Plocka rimliga headers från origin
    const ct = res.headers.get("content-type") || "image/jpeg";
    const cc =
      res.headers.get("cache-control") ||
      `public, max-age=${DEFAULT_MAX_AGE}, immutable`;
    const etag = res.headers.get("etag") || undefined;
    const cd = res.headers.get("content-disposition") || "inline";

    const headers: Record<string, string> = {
      "content-type": ct,
      "cache-control": cc,
      "content-disposition": cd,
    };
    if (etag) headers["etag"] = etag;
    headers["content-length"] = String(buf.byteLength);

    return new NextResponse(buf, { headers });
  } catch (err) {
    // Fånga alla konstiga fel
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
