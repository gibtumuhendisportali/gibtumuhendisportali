import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@gibtu/shared";
import { EditorialPortalVisual } from "@/components/landing/EditorialPortalVisual";
import { SiteHeader } from "@/components/landing/SiteHeader";

export default function HomePage() {
  const dict = getDictionary("tr");

  return (
    <div id="ana-sayfa" className="min-h-screen flex flex-col bg-paper text-ink">
      <SiteHeader />

      <main className="flex-1">
        {/* 1. Asimetrik Editoryal Hero */}
        <section className="editorial-grid-bg border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-12 lg:items-center lg:gap-14 lg:py-20">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2.5 border-b border-brass pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">
                  {dict.common.phaseZeroBadge}
                </span>
              </div>

              <h1 className="mt-5 font-heading text-3xl font-semibold leading-[1.12] tracking-[-0.02em] text-navy sm:text-5xl lg:text-[3.35rem]">
                {dict.landing.headline}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
                {dict.landing.lead}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <Link
                  href="/register"
                  className="w-full border border-navy bg-navy px-7 py-3.5 text-center text-sm font-medium text-paper transition-opacity hover:opacity-90 sm:w-auto"
                >
                  {dict.landing.primaryCta}
                </Link>
                <Link
                  href="/login"
                  className="w-full border border-navy bg-surface px-7 py-3.5 text-center text-sm font-medium text-navy transition-colors hover:bg-navy hover:text-paper sm:w-auto"
                >
                  {dict.landing.secondaryCta}
                </Link>
                <a
                  href="#moduller"
                  className="pt-1 text-center text-sm font-medium text-ink-muted underline underline-offset-4 hover:text-navy sm:ml-2 sm:pt-0 sm:text-left"
                >
                  {dict.landing.exploreLink}
                </a>
              </div>

              {/* Öğrenci <-> Mezun Köprüsü */}
              <div className="mt-10 grid gap-6 border-t border-border pt-7 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
                    {dict.landing.bridge.studentTitle}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    {dict.landing.bridge.studentBody}
                  </p>
                </div>
                <div className="sm:border-l sm:border-border sm:pl-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
                    {dict.landing.bridge.alumniTitle}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    {dict.landing.bridge.alumniBody}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <EditorialPortalVisual />
            </div>
          </div>
        </section>

        {/* 2. Portal Modülleri — Kartsız, Çizgili Editoryal Prospektüs Düzeni */}
        <section id="moduller" className="border-b border-border bg-surface py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col justify-between gap-4 pb-8 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brass">
                  01 — {dict.nav.network}
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
                  {dict.landing.modulesHeading}
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-ink-muted">
                {dict.landing.modulesSubheading}
              </p>
            </div>

            <div className="mt-6 grid gap-10 md:grid-cols-3 md:gap-8">
              {dict.landing.modules.map((mod) => (
                <article key={mod.index} className="border-t-2 border-navy pt-6">
                  <span className="text-xs font-semibold tracking-[0.16em] text-brass">
                    {mod.index}
                  </span>
                  <h3 className="mt-3 font-heading text-xl font-semibold text-navy">
                    {mod.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    {mod.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Üyelik Süreci — İki Sütunlu Defter (Ledger) Akışı */}
        <section id="uyelik-sureci" className="border-b border-border py-12 sm:py-16 lg:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brass">
                02 — {dict.landing.processHeading}
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
                {dict.landing.processHeading}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">
                {dict.landing.processSubheading}
              </p>
              <p className="mt-6 border-l-2 border-brass pl-4 text-xs leading-relaxed text-ink-muted">
                {dict.common.institutionNotice}
              </p>
            </div>

            <ol className="divide-y divide-border border-y border-border lg:col-span-7">
              {dict.landing.processSteps.map((step) => (
                <li
                  key={step.step}
                  className="grid gap-2 py-6 sm:grid-cols-12 sm:items-baseline sm:gap-6"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brass sm:col-span-3">
                    {step.step}
                  </span>
                  <div className="sm:col-span-9">
                    <h3 className="font-heading text-lg font-semibold text-navy">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 4. Kurucu Katkı Sağlayan Topluluklar */}
        <section id="kurucu-topluluklar" className="border-b border-border bg-surface py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brass">
                03 — {dict.nav.about}
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
                {dict.landing.foundingHeading}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">
                {dict.landing.foundingDescription}
              </p>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <article className="flex flex-col gap-5 border border-border bg-paper p-6 sm:flex-row sm:items-start sm:p-7">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border bg-navy">
                  <Image
                    src="/brand/yazek-logo.jpg"
                    alt="YAZEK — GİBTÜ Yapay Zeka Öğrenci Topluluğu Logosu"
                    width={1024}
                    height={1024}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
                    {dict.landing.communities.yazekRole}
                  </p>
                  <h3 className="mt-1.5 font-heading text-2xl font-semibold text-navy">
                    {dict.landing.communities.yazekName}
                  </h3>
                  <p className="mt-0.5 text-sm font-medium text-sage">
                    {dict.landing.communities.yazekDescription}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    {dict.landing.communities.yazekFocus}
                  </p>
                </div>
              </article>

              <article className="flex flex-col gap-5 border border-border bg-paper p-6 sm:flex-row sm:items-start sm:p-7">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center">
                  <Image
                    src="/brand/rep-logo.png"
                    alt="REP Kulübü Logosu"
                    width={258}
                    height={203}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
                    {dict.landing.communities.repRole}
                  </p>
                  <h3 className="mt-1.5 font-heading text-2xl font-semibold text-navy">
                    {dict.landing.communities.repName}
                  </h3>
                  <p className="mt-0.5 text-sm font-medium text-sage">
                    {dict.landing.communities.repDescription}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    {dict.landing.communities.repFocus}
                  </p>
                </div>
              </article>
            </div>

            <p className="mt-8 border-l-2 border-sage pl-4 text-sm leading-relaxed text-ink-muted">
              {dict.landing.foundingGovernanceNote}
            </p>
          </div>
        </section>

        {/* 5. 3 Aralık Dünya Mühendisler Günü Etkinlik Tanıtım Alanı */}
        <section id="etkinlikler" className="border-b border-border py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid border border-navy bg-navy text-paper lg:grid-cols-12">
              <div className="flex flex-col justify-between border-b border-paper/20 p-7 sm:p-8 lg:col-span-4 lg:border-b-0 lg:border-r lg:p-10">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brass">
                  {dict.landing.featuredEvent.eyebrow}
                </span>
                <div className="my-6 sm:my-8">
                  <p className="font-heading text-5xl font-semibold tracking-tight text-paper sm:text-6xl">
                    3
                  </p>
                  <p className="mt-1 font-heading text-xl font-semibold uppercase tracking-[0.14em] text-brass">
                    Aralık
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-paper/70">
                    Dünya Mühendisler Günü
                  </p>
                </div>
                <div className="h-px w-16 bg-brass/70" aria-hidden="true" />
              </div>

              <div className="flex flex-col justify-between p-7 sm:p-8 lg:col-span-8 lg:p-10">
                <div>
                  <span className="inline-block border border-brass/60 px-3 py-1 text-xs font-medium text-brass">
                    {dict.landing.featuredEvent.statusBadge}
                  </span>
                  <h2 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
                    {dict.landing.featuredEvent.title}
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-paper/85">
                    {dict.landing.featuredEvent.description}
                  </p>
                  <p className="mt-4 max-w-2xl border-l-2 border-brass/60 pl-4 text-xs leading-relaxed text-paper/70">
                    {dict.landing.featuredEvent.note}
                  </p>
                </div>

                <div className="mt-8">
                  <Link
                    href="/register"
                    className="inline-block w-full border border-brass bg-brass px-6 py-3 text-center text-sm font-medium text-navy transition-opacity hover:opacity-90 sm:w-auto"
                  >
                    {dict.landing.featuredEvent.cta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Kurumsal Footer ve KVKK Bağlantıları */}
      <footer className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <Image
                src="/brand/gibtu-logo.png"
                alt="Gaziantep İslam Bilim ve Teknoloji Üniversitesi Logosu"
                width={1024}
                height={490}
                className="h-10 w-auto object-contain"
              />
              <p className="mt-4 font-heading text-base font-semibold text-navy">
                {dict.common.brandName}
              </p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
                {dict.landing.footer.aboutText}
              </p>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-navy">
                {dict.landing.footer.navigationHeading}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                <li>
                  <a href="#ana-sayfa" className="hover:text-navy">
                    {dict.nav.home}
                  </a>
                </li>
                <li>
                  <a href="#moduller" className="hover:text-navy">
                    {dict.nav.network}
                  </a>
                </li>
                <li>
                  <a href="#etkinlikler" className="hover:text-navy">
                    {dict.nav.events}
                  </a>
                </li>
                <li>
                  <a href="#kurucu-topluluklar" className="hover:text-navy">
                    {dict.nav.about}
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-navy">
                {dict.landing.footer.accountHeading}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                <li>
                  <Link href="/login" className="hover:text-navy">
                    {dict.common.login}
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-navy">
                    {dict.common.register}
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-navy">
                {dict.landing.footer.privacyHeading}
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                {dict.landing.footer.privacySummary}
              </p>
              <Link
                href="/kvkk"
                className="mt-3 inline-block text-xs font-medium text-navy underline underline-offset-4 hover:text-brass"
              >
                {dict.landing.footer.kvkkLink}
              </Link>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6 text-xs text-ink-muted">
            {dict.landing.footer.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
