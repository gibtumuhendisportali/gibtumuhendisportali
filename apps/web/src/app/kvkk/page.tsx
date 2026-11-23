import { getDictionary } from "@gibtu/shared";
import { AuthPageShell } from "@/components/layout/AuthPageShell";

export default function KvkkPage() {
  const dict = getDictionary("tr");

  return (
    <AuthPageShell>
      <article className="border border-border bg-surface p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
          {dict.kvkk.eyebrow}
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-navy">
          {dict.kvkk.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{dict.kvkk.intro}</p>

        <div className="mt-6 space-y-5 border-t border-border pt-6">
          {dict.kvkk.sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-heading text-base font-semibold text-navy">
                {section.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{section.body}</p>
            </section>
          ))}
        </div>
      </article>
    </AuthPageShell>
  );
}
