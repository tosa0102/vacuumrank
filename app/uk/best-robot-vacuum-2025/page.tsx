'use client';

import Link from "next/link";

// SEO
export const metadata = {
  title: "Best Robot Vacuums in the UK (August 2025) — VacuumRank",
  description: "Premium • Performance • Budget — desk-tested and ranked for the UK. Updated monthly.",
};

function mdToHtml(md: string) {
  // Minimal, friendly markdown → HTML (rubriker, listor, blockcitat, feta ord, rader).
  // Räcker för vår artikel. Vi kan byta till MDX senare.
  const esc = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  // Bold **text**
  md = md.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Blockquote > ...
  md = md.replace(/^\s*>\s?(.*)$/gm, "<blockquote>$1</blockquote>");
  // H1/H2/H3
  md = md.replace(/^###\s?(.*)$/gm, "<h3>$1</h3>");
  md = md.replace(/^##\s?(.*)$/gm, "<h2>$1</h2>");
  md = md.replace(/^#\s?(.*)$/gm, "<h1>$1</h1>");
  // Lists
  // Bullets
  md = md.replace(/^(?:-|\*)\s+(.*)$/gm, "<li>$1</li>");
  md = md.replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>");
  // Numbered
  md = md.replace(/^\d+\)\s+(.*)$/gm, "<li>$1</li>");
  md = md.replace(/^\d+\.\s+(.*)$/gm, "<li>$1</li>");
  md = md.replace(/(<li>[\s\S]*?<\/li>)/g, (m) => m.includes("<ul>") ? m : m);
  // Horizontal rule ---
  md = md.replace(/^\s*---\s*$/gm, "<hr/>");
  // Paragraphs: tom rad → ny paragraf
  md = md.split(/\n{2,}/).map(block=>{
    if (block.match(/^<h[1-3]|<ul>|<li>|<hr|<blockquote/)) return block;
    if (block.trim().startsWith("<")) return block;
    return `<p>${block.replace(/\n/g,"<br/>")}</p>`;
  }).join("\n");
  // Wrap list items that are not already wrapped
  md = md.replace(/(?:^|\n)(<li>[\s\S]*?<\/li>)(?=\n|$)/g, "\n<ul>$1</ul>");
  return md;
}

const ARTICLE_MD = `
PASTE THE ARTICLE TEXT FROM THE CANVAS HERE
(hela artikeln – exakt som den står i canvasen)
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
