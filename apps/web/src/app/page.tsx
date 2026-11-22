import { getDictionary } from "@gibtu/shared";

export default function HomePage() {
  const dict = getDictionary("tr");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-lg font-medium tracking-tight text-navy">
              {dict.common.brandName}
            </span>
            <span className="border border-border px-2 py-0.5 text-xs font-medium text-sage">
              {dict.common.phaseZeroBadge}
            </span>
          </div>
          <nav aria-label="Primary" className="flex items-center gap-6 text-sm text-ink-muted">
            <span>{dict.common.login}</span>
            <span className="border border-navy px-3.5 py-1.5 text-navy font-medium">
              {dict.common.register}
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 md:py-24">
        <section className="max-w-3xl border-b border-border pb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass">
            {dict.landing.eyebrow}
          </p>
          <h1 className="mt-4 font-serif text-4xl font-normal leading-tight tracking-tight text-navy md:text-5xl">
            {dict.landing.headline}
          </h1>
          <p className="mt-6 text-base leading-relaxed text-ink-muted md:text-lg">
            {dict.landing.lead}
          </p>
          <p className="mt-6 border-l-2 border-brass pl-4 text-sm text-ink-muted">
            {dict.common.institutionNotice}
          </p>
        </section>

        <section className="border-b border-border py-14">
          <div className="max-w-2xl">
            <h2 className="font-serif text-2xl font-normal text-navy">
              {dict.landing.foundingHeading}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {dict.landing.foundingDescription}
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="border border-border bg-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
                {dict.landing.communities.yazekName}
              </p>
              <p className="mt-2 font-serif text-xl text-navy">
                {dict.landing.communities.yazekDescription}
              </p>
            </div>
            <div className="border border-border bg-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
                {dict.landing.communities.repName}
              </p>
              <p className="mt-2 font-serif text-xl text-navy">
                {dict.landing.communities.repDescription}
              </p>
            </div>
          </div>
        </section>

        <section className="pt-14">
          <h2 className="font-serif text-2xl font-normal text-navy">
            {dict.landing.pillarsHeading}
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <article className="border-t border-border pt-5">
              <h3 className="text-sm font-semibold text-navy">
                {dict.landing.pillars.directoryTitle}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {dict.landing.pillars.directoryBody}
              </p>
            </article>
            <article className="border-t border-border pt-5">
              <h3 className="text-sm font-semibold text-navy">
                {dict.landing.pillars.eventsTitle}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {dict.landing.pillars.eventsBody}
              </p>
            </article>
            <article className="border-t border-border pt-5">
              <h3 className="text-sm font-semibold text-navy">
                {dict.landing.pillars.privacyTitle}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {dict.landing.pillars.privacyBody}
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-6 text-xs text-ink-muted">
          {dict.landing.footerNote}
        </div>
      </footer>
    </div>
  );
}
