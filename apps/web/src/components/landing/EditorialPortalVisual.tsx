import Image from "next/image";
import { getDictionary } from "@gibtu/shared";

export function EditorialPortalVisual() {
  const dict = getDictionary("tr");
  const visual = dict.landing.heroVisual;

  return (
    <aside aria-label={visual.title} className="space-y-3">
      <div className="border border-navy bg-navy text-paper">
        {/* Photo-ready architectural composition slot */}
        <div className="relative aspect-[16/9] overflow-hidden border-b border-paper/20 bg-navy p-5 sm:p-6">
          <svg
            aria-hidden="true"
            viewBox="0 0 400 225"
            fill="none"
            className="h-full w-full"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Subtle architectural grid lines */}
            <line x1="0" y1="56" x2="400" y2="56" stroke="#F5F3ED" strokeOpacity="0.1" />
            <line x1="0" y1="112" x2="400" y2="112" stroke="#F5F3ED" strokeOpacity="0.1" />
            <line x1="0" y1="168" x2="400" y2="168" stroke="#F5F3ED" strokeOpacity="0.1" />
            <line x1="100" y1="0" x2="100" y2="225" stroke="#F5F3ED" strokeOpacity="0.1" />
            <line x1="200" y1="0" x2="200" y2="225" stroke="#F5F3ED" strokeOpacity="0.1" />
            <line x1="300" y1="0" x2="300" y2="225" stroke="#F5F3ED" strokeOpacity="0.1" />

            {/* Student <-> Alumni bridge arc */}
            <path
              d="M 64 168 Q 200 32 336 168"
              stroke="#A88758"
              strokeWidth="1.5"
              strokeOpacity="0.9"
            />
            <path
              d="M 100 168 Q 200 72 300 168"
              stroke="#F5F3ED"
              strokeWidth="1"
              strokeOpacity="0.35"
              strokeDasharray="4 4"
            />
            <circle cx="64" cy="168" r="4" fill="#A88758" />
            <circle cx="336" cy="168" r="4" fill="#A88758" />
            <circle cx="200" cy="100" r="3" fill="#F5F3ED" fillOpacity="0.8" />
          </svg>

          <div className="absolute inset-x-5 top-4 flex items-center justify-between sm:inset-x-6">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brass sm:text-[11px]">
              {visual.tag}
            </span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-paper/60">
              GİBTÜ
            </span>
          </div>

          <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-4 sm:inset-x-6">
            <div>
              <h2 className="font-heading text-lg font-semibold tracking-tight text-paper sm:text-xl">
                {visual.title}
              </h2>
              <p className="mt-0.5 text-xs text-paper/75">{visual.photoSlotCaption}</p>
            </div>
          </div>
        </div>

        {/* Concise architectural index */}
        <ol className="divide-y divide-paper/15 px-5 py-2 sm:px-6">
          {visual.items.map((item) => (
            <li key={item.index} className="flex items-start gap-4 py-3.5">
              <span className="pt-0.5 font-heading text-xs font-semibold tracking-wider text-brass">
                {item.index}
              </span>
              <div>
                <p className="text-sm font-medium text-paper">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-paper/70">{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Layered founding community seal strip */}
      <div className="flex items-center justify-between gap-4 border border-border bg-surface px-5 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          {visual.footnote}
        </span>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-full border border-border bg-navy">
            <Image
              src="/brand/yazek-logo.jpg"
              alt="YAZEK — GİBTÜ Yapay Zeka Öğrenci Topluluğu Logosu"
              width={1024}
              height={1024}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex h-11 w-11 items-center justify-center">
            <Image
              src="/brand/rep-logo.png"
              alt="REP Kulübü Logosu"
              width={258}
              height={203}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
