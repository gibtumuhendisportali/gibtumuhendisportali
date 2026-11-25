import Image from "next/image";
import Link from "next/link";
import {
  ENGINEERING_DEPARTMENTS,
  getDictionary,
  type DirectoryListResponse,
} from "@gibtu/shared";

const dict = getDictionary("tr");

function avatarKeyToUrl(avatarKey: string | null): string | null {
  if (!avatarKey) return null;
  const parts = avatarKey.split("/");
  if (parts.length !== 3 || parts[0] !== "avatars") return null;
  return `/api/portal/media/avatar/${encodeURIComponent(parts[1] ?? "")}/${encodeURIComponent(parts[2] ?? "")}`;
}

interface DirectoryClientProps {
  data: DirectoryListResponse;
  filters: {
    q: string;
    userType: string;
    department: string;
  };
}

export function DirectoryClient({ data, filters }: DirectoryClientProps) {
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  function buildPageHref(nextPage: number): string {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.userType !== "all") params.set("userType", filters.userType);
    if (filters.department !== "all") params.set("department", filters.department);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/directory?${qs}` : "/directory";
  }

  return (
    <div className="mt-8 space-y-8">
      <form
        method="get"
        action="/directory"
        className="grid gap-3 border border-border bg-surface p-5 md:grid-cols-12"
      >
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder={dict.directory.searchPlaceholder}
          className="border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none md:col-span-5"
        />

        <select
          name="userType"
          defaultValue={filters.userType}
          className="border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none md:col-span-2"
        >
          <option value="all">{dict.directory.allTypesOption}</option>
          <option value="student">{dict.dashboard.userTypeStudent}</option>
          <option value="alumni">{dict.dashboard.userTypeAlumni}</option>
        </select>

        <select
          name="department"
          defaultValue={filters.department}
          className="border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none md:col-span-3"
        >
          <option value="all">{dict.directory.allDepartmentsOption}</option>
          {ENGINEERING_DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="border border-navy bg-navy px-4 py-2 text-sm font-medium text-paper hover:opacity-90 md:col-span-2"
        >
          {dict.directory.filterButton}
        </button>
      </form>

      <p className="text-xs font-medium text-ink-muted">
        {dict.directory.totalResultsPrefix} {data.total} {dict.directory.totalResultsSuffix}
      </p>

      {data.items.length === 0 ? (
        <div className="border border-border bg-surface p-8 text-sm text-ink-muted">
          {dict.directory.emptyState}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {data.items.map((member) => {
            const avatarUrl = avatarKeyToUrl(member.avatarKey);
            const hasLinks = Boolean(member.linkedinUrl || member.githubUrl || member.websiteUrl);

            return (
              <article key={member.userId} className="border border-border bg-surface p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-border bg-paper text-base font-semibold text-navy">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={member.fullName}
                        width={56}
                        height={56}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{member.fullName.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="font-heading text-lg font-semibold text-navy">
                        {member.fullName}
                      </h2>
                      <span className="border border-border px-2 py-0.5 text-[11px] font-medium text-brass">
                        {member.userType === "alumni"
                          ? dict.dashboard.userTypeAlumni
                          : dict.dashboard.userTypeStudent}
                      </span>
                    </div>

                    {member.headline && (
                      <p className="mt-1 text-sm font-medium text-ink">{member.headline}</p>
                    )}

                    <p className="mt-1 text-xs text-ink-muted">
                      {member.department} • {member.entryYear}
                      {member.graduationYear ? ` – ${member.graduationYear}` : ""}
                      {member.company ? ` • ${member.company}` : ""}
                      {member.city ? ` (${member.city})` : ""}
                    </p>
                  </div>
                </div>

                {member.bio && (
                  <p className="mt-4 text-sm leading-relaxed text-ink-muted">{member.bio}</p>
                )}

                {member.skills.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {member.skills.map((skill) => (
                      <li
                        key={skill}
                        className="border border-border bg-paper px-2.5 py-0.5 text-xs text-ink"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                )}

                {(member.contactEmail || hasLinks) && (
                  <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs">
                    {member.contactEmail && (
                      <p className="text-ink-muted">
                        <span className="font-medium text-navy">{dict.directory.contactLabel}: </span>
                        <a
                          href={`mailto:${member.contactEmail}`}
                          className="underline underline-offset-4 hover:text-navy"
                        >
                          {member.contactEmail}
                        </a>
                      </p>
                    )}
                    {hasLinks && (
                      <div className="flex flex-wrap items-center gap-4 text-navy">
                        <span className="font-medium">{dict.directory.linksLabel}:</span>
                        {member.linkedinUrl && (
                          <a
                            href={member.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-4 hover:text-brass"
                          >
                            LinkedIn
                          </a>
                        )}
                        {member.githubUrl && (
                          <a
                            href={member.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-4 hover:text-brass"
                          >
                            GitHub
                          </a>
                        )}
                        {member.websiteUrl && (
                          <a
                            href={member.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-4 hover:text-brass"
                          >
                            Web
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
          {data.page > 1 ? (
            <Link
              href={buildPageHref(data.page - 1)}
              className="border border-border px-4 py-2 text-navy hover:border-navy"
            >
              {dict.directory.prevPage}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-ink-muted">
            {data.page} / {totalPages}
          </span>
          {data.page < totalPages ? (
            <Link
              href={buildPageHref(data.page + 1)}
              className="border border-border px-4 py-2 text-navy hover:border-navy"
            >
              {dict.directory.nextPage}
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
