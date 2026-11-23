"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@gibtu/shared";

export function SiteHeader() {
  const dict = getDictionary("tr");
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { href: "#ana-sayfa", label: dict.nav.home },
    { href: "#moduller", label: dict.nav.network },
    { href: "#etkinlikler", label: dict.nav.events },
    { href: "#kurucu-topluluklar", label: dict.nav.about },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      {/* Institutional top strip */}
      <div className="bg-navy px-4 py-1.5 text-center text-[10px] font-medium tracking-[0.12em] text-paper/90 sm:px-6 sm:text-left sm:text-[11px]">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="truncate">{dict.landing.eyebrow}</span>
          <span className="hidden shrink-0 text-brass sm:inline">YAZEK • REP</span>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-3.5">
        <Link
          href="/"
          className="flex items-center gap-3 text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        >
          <Image
            src="/brand/gibtu-logo.png"
            alt="Gaziantep İslam Bilim ve Teknoloji Üniversitesi Logosu"
            width={1024}
            height={490}
            priority
            className="h-9 w-auto object-contain sm:h-11"
          />
          <span
            aria-hidden="true"
            className="hidden h-7 w-px bg-border sm:inline-block"
          />
          <span className="hidden font-heading text-sm font-semibold tracking-tight text-navy sm:inline-block lg:text-base">
            {dict.common.brandName}
          </span>
        </Link>

        <nav aria-label="Ana menü" className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-muted transition-colors hover:text-navy"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="px-3 py-2 text-sm font-medium text-navy transition-colors hover:text-brass"
          >
            {dict.common.login}
          </Link>
          <Link
            href="/register"
            className="border border-navy bg-navy px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90"
          >
            {dict.common.register}
          </Link>
        </div>

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? dict.nav.closeMenu : dict.nav.openMenu}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex items-center justify-center border border-border px-3.5 py-2 text-xs font-medium text-navy md:hidden"
        >
          {menuOpen ? dict.nav.closeMenu : dict.nav.openMenu}
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-nav" className="border-t border-border bg-surface px-4 py-5 sm:px-6 md:hidden">
          <nav aria-label="Mobil menü" className="flex flex-col divide-y divide-border">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 text-sm font-medium text-ink hover:text-navy"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2.5 pt-2">
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="border border-navy bg-navy px-4 py-2.5 text-center text-sm font-medium text-paper"
            >
              {dict.common.register}
            </Link>
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="border border-navy px-4 py-2.5 text-center text-sm font-medium text-navy"
            >
              {dict.common.login}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
