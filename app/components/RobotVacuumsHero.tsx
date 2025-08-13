"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function RobotVacuumsHero() {
  // Dynamisk månad + år: "August 2025"
  const monthYear = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Vänster: logga + varumärke (som i bilden) */}
        <div className="pointer-events-none absolute left-0 top-0 hidden select-none items-center gap-3 md:flex">
          <Image
            src="/rankpilot-logo.jpg"
            alt="RankPilot"
            width={76}
            height={76}
            priority
          />
          <span className="text-3xl font-semibold tracking-tight text-slate-800">
            RankPilot
          </span>
        </div>

        {/* Centrerad titel + underrad + pill-knapp */}
        <div className="flex flex-col items-center pt-6 pb-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
            Best Robot Vacuums in the UK ({monthYear})
          </h1>

          <p className="mt-2 text-base sm:text-lg text-slate-600">
            Premium • Performance • Budget — desk-tested and ranked
          </p>

          {/* ← Detta är "pill-knappen" i din bild */}
          <Link
            href="/best-robot-vacuum-2025"
            className="mt-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm sm:text-base text-slate-700 shadow-sm hover:bg-white"
          >
            Read: Best Robot Vacuums 2025 (UK)
          </Link>
        </div>

        {/* Breadcrumb (vänsterjusterad, liten) */}
        <nav
          aria-label="Breadcrumb"
          className="mt-2 text-sm text-slate-500"
        >
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span className="px-2">/</span>
          <span className="text-slate-700">Robot vacuums</span>
        </nav>

        {/* "Top picks" rubriken precis under */}
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
          Top picks
        </h2>
      </div>
    </header>
  );
}
