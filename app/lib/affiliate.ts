// app/lib/affiliate.ts

export function withAffiliate(url?: string): string {
  if (!url) return "#";
  try {
    const u = new URL(url);

    // Amazon UK affiliate
    const isAmazonUK =
      u.hostname === "www.amazon.co.uk" ||
      u.hostname === "amazon.co.uk" ||
      u.hostname.endsWith(".amazon.co.uk");

    if (isAmazonUK) {
      const tag = process.env.NEXT_PUBLIC_AMAZON_TAG_UK;
      if (tag && tag.trim()) {
        u.searchParams.set("tag", tag.trim());
      }
    }

    return u.toString();
  } catch {
    return url;
  }
}

export function amazonSearchFallback(query: string): string {
  const u = new URL("https://www.amazon.co.uk/s");
  u.searchParams.set("k", query);
  const tag = process.env.NEXT_PUBLIC_AMAZON_TAG_UK;
  if (tag && tag.trim()) u.searchParams.set("tag", tag.trim());
  return u.toString();
}
