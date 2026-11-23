import Link from "next/link";
import { getDictionary } from "@gibtu/shared";

interface AuthPageShellProps {
  children: React.ReactNode;
}

export function AuthPageShell({ children }: AuthPageShellProps) {
  const dict = getDictionary("tr");

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-serif text-lg font-medium tracking-tight text-navy hover:opacity-85"
          >
            {dict.common.brandName}
          </Link>
          <Link
            href="/"
            className="text-sm text-ink-muted hover:text-navy transition-colors"
          >
            {dict.common.backToHome}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        {children}
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-5 text-xs text-ink-muted">
          {dict.landing.footerNote}
        </div>
      </footer>
    </div>
  );
}
