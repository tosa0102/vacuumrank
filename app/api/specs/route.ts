// app/api/specs/route.ts
import { NextResponse } from "next/server";
import { fetchProductSpecs } from "@/app/lib/specs";

export const runtime = "nodejs"; // vi vill köra på Node (inte Edge) för extern fetch

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { brand, model, name, hintUrls } = (body ?? {}) as {
      brand?: string;
      model?: string;
      name?: string;
      hintUrls?: string[];
    };

    const specs = await fetchProductSpecs({ brand, model, name, hintUrls });
    return NextResponse.json(specs ?? {}, { status: 200 });
  } catch (e) {
    console.error("[/api/specs] Error:", e);
    return NextResponse.json({}, { status: 200 });
  }
}
