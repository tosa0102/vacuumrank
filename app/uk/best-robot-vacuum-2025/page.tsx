import Link from "next/link";

// SEO
export const metadata = {
  title: "Best Robot Vacuums in the UK (August 2025) — VacuumRank",
  description: "Premium • Performance • Budget — desk-tested and ranked for the UK. Updated monthly.",
};

function mdToHtml(md: string) {
  // Minimal markdown → HTML (rubriker, listor, blockcitat, bold, horisontell linje, stycken)
  // Bold **text**
  md = md.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Blockquote > ...
  md = md.replace(/^\s*>\s?(.*)$/gm, "<blockquote>$1</blockquote>");
  // H1/H2/H3
  md = md.replace(/^###\s?(.*)$/gm, "<h3>$1</h3>");
  md = md.replace(/^##\s?(.*)$/gm, "<h2>$1</h2>");
  md = md.replace(/^#\s?(.*)$/gm, "<h1>$1</h1>");
  // List items
  md = md.replace(/^(?:-|\*)\s+(.*)$/gm, "<li>$1</li>");
  md = md.replace(/^\d+[.)]\s+(.*)$/gm, "<li>$1</li>");
  // Wrap fristående li till ul
  md = md.replace(/((?:^|\n)<li>[\s\S]*?<\/li>)/g, (m) => `\n<ul>${m}</ul>`);
  // Horisontell linje ---
  md = md.replace(/^\s*---\s*$/gm, "<hr/>");
  // Paragrafer
  md = md
    .split(/\n{2,}/)
    .map((block) => {
      if (/^<h[1-3]|^<ul>|^<li>|^<hr|^<blockquote/.test(block.trim())) return block;
      if (block.trim().startsWith("<")) return block;
      return `<p>${block.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
  return md;
}

const ARTICLE_MD = `
# Best Robot Vacuums in the UK (August 2025)

**Premium • Performance • Budget — desk-tested and ranked**

> This guide is built from our country-specific desk tests: we combine current UK pricing and availability with a feature/spec score and a review score (for Premium). We update monthly.

---

## TL;DR — Winners by price band

- **Premium (≥ £900):** **ECOVACS Deebot X8 Pro Omni** — flagship features at the most accessible Premium price right now; excellent roller-mop system and corner coverage.
- **Performance (£400–£899):** **eufy X10 Pro Omni** — all-in-one dock at a mid-tier price, strong user reviews, very low ownership friction.
- **Budget (≤ £399):** **Tapo RV30 Max Plus** — rare combo of LiDAR mapping and an auto-empty dock well under £300.

> Full tables (with scores) are available as downloadable CSVs from this page in Chat. Use them to sort/filter by what matters most to you.

---

## How we select models (UK)

1. **Popularity now**: we monitor UK best-seller lists and major retailers (Amazon UK, Argos, Currys, John Lewis) to ensure models are actively bought **this month**.
2. **Current-gen hardware**: focus on robots launched or refreshed in the last ~18 months or carrying a notable hardware upgrade (e.g., new dock, new mop system).
3. **Availability**: must be officially sold in the UK (no grey import) and in stock at two or more major retailers **or** at the brand’s UK store.
4. **Price band gates**: Premium ≥ £900, Performance £400–£899, Budget ≤ £399. We use *street price* (not just RRP).
5. **Feature completeness** (esp. Premium/Performance): hands-off docks (auto-empty, mop washing, drying, water refill) score higher.

---

## Scoring model

- **Spec score (0–10):** suction, mop system (roller > dual-spin > vibrating > single pad), dock automation (empty/wash/dry/refill), edge/corner tools, navigation (LiDAR + 3D/AI preferred).
- **Review score (0–10):** (Premium only in this first article) UK-weighted from verified retailer reviews. Weighted by volume recency.
- **Value score (0–10):** cheaper within the band = higher value.
- **Overall**: Premium = 50% Spec + 40% Review + 10% Value; Performance/Budget (v1) = 60% Spec + 40% Value.

We’ll add review weighting to Performance/Budget when we’ve finished collecting UK-only review data across retailers.

---

## Premium (≥ £900): Top picks

### 1) ECOVACS Deebot X8 Pro Omni — **Best Premium**

**Why it wins:** Strong roller-mop system with real-time rinsing, robust debris pickup, and a fully automated dock at the lowest current price point in Premium.

**Good for:** Mixed hard floors + rugs, low-maintenance homes, pet hair.

**Watch-outs:** The dock is physically large; check space depth.

---

### 2) Dreame X50 Ultra — **Best for deep clean & edges**

**Why:** 20,000Pa class suction, edge-reach (MopExtend / dual flex arms), hot-water mop wash and heated drying. Excellent hard-floor results.

**Watch-outs:** Premium consumable costs; performance on thick carpet depends on settings.

---

### 3) Roborock S8 MaxV Ultra — **Best ecosystem & app**

**Why:** Mature app, obstacle avoidance, corner/edge targeted cleaning (FlexiArm/Edge Mop), reliable LiDAR + AI camera stack.

**Watch-outs:** High parts pricing; edge tool effectiveness varies by floor plan.

---

### 4) Roborock Saros Z70 — **Cutting-edge tech**

**Why:** Category-leading suction and a mechanical arm for edge/spot cleaning. A true halo robot.

**Watch-outs:** Expensive; still early in market—firmware evolves quickly.

---

### 5) eufy Omni S1 Pro — **Great for hard floors**

**Why:** Long roller-mop with thorough coverage and a fully automated base.

**Watch-outs:** Dock footprint; keep an eye on detergent/solution costs.

---

## Performance (£400–£899): Top picks

### 1) eufy X10 Pro Omni — **Best Performance**

All-in-one dock under £700, solid cleaning, and low daily maintenance.

### 2) ECOVACS Deebot T50 Pro Omni — **Best features under £700**

High suction, TruEdge 2.0 mop reach, full dock automation.

### 3) Samsung Jet Bot Combo+ — **Best camera-based navigation at this price**

Strong mapping with a compact all-in-one base.

### 4) Dreame L10s Ultra Gen 2 — **Best value auto-dock**

Notably low UK street price for a full dock robot; good hard-floor mopping.

### 5) Roborock Q Revo S — **Best mid-tier with dual-spin mops**

Modern Roborock features and mop lift at a mid-range price.

> Full Performance table with scores is included in the CSV linked above.

---

## Budget (≤ £399): Top picks

### 1) Tapo RV30 Max Plus — **Best Budget**

LiDAR mapping + auto-empty at a budget price; rare combo at this level.

### 2) eufy L60 Hybrid (Self-Empty)** — **Best budget with mopping**

Compact body, app control, and its own auto-empty station.

### 3) Roborock Q7 M5 — **Best mapping in budget**

A recent refresh delivering robust LiDAR navigation at a very low price.

### 4) Proscenic 850T — **Most features under ~£150**

Mop function and app control at a rock-bottom street price.

### 5) Lefant M210P — **Best ultra-cheap**

Simple bump-and-go navigation but incredibly low cost; ideal for quick daily dust control.

> Full Budget table with scores is included in the CSV linked above.

---

## Buying tips (UK)

- **Check dock depth & water access.** All-in-one bases can be deep; some (e.g., SwitchBot S10) can plumb into water lines.
- **Floor mix matters.** Roller/dual-spin mops shine on tiles/wood; thick carpets need good carpet detection and mop lift.
- **Pet hair?** Prefer rubber dual brushes and strong anti-tangle designs.
- **Noise & schedules.** Verify “quiet” modes and drying noise if you’re in a flat.

---

## Methodological transparency

- This is a **desk test**: we do not buy/handle units; we normalise data from brand spec sheets, retailer listings, and UK-specific review sources.
- We account for missing spec fields (e.g., some brands don’t publish Pa suction) by re-normalising the spec rubric.
- We record live street prices and re-score monthly; if a model price migrates across a band, it will move category.

---

## What’s next

- Add UK review weighting to Performance & Budget.
- Publish the Sweden and US versions with local pricing and availability.
- Launch our ‘Compare’ widget so you can pick any 3 models and see spec deltas instantly.

*Prepared August 9, 2025.*
`;

export default function Page() {
  const published = "2025-08-09";
  const modified = "2025-08-09";
  const html = mdToHtml(ARTICLE_MD);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Best Robot Vacuums in the UK (August 2025)",
    "datePublished": published,
    "dateModified": modified,
    "author": { "@type": "Organization", "name": "VacuumRank" },
    "inLanguage": "en-GB"
  };

  return (
    <div className="grid gap-6">
      <nav className="text-sm text-gray-500">
        <Link href="/" className="hover:underline">Home</Link> /{" "}
        <Link href="/uk" className="hover:underline">United Kingdom</Link> /{" "}
        <span>Best Robot Vacuums 2025</span>
      </nav>

      <h1 className="text-3xl font-bold">Best Robot Vacuums in the UK (August 2025)</h1>
      <p className="text-gray-600">Premium • Performance • Budget — desk-tested and ranked</p>

      <article className="card p-6 leading-7 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:text-gray-600">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
