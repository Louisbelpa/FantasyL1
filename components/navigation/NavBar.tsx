"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const NAV_LINKS = [
  { href: "/", label: "Mon Équipe", icon: ShirtIcon },
  { href: "/transferts", label: "Transferts", icon: TransfersIcon },
  { href: "/ligues", label: "Ligues", icon: TrophyIcon },
  { href: "/classements", label: "Classements", icon: RankingIcon },
] as const;

export default function NavBar({ authEnabled = false }: { authEnabled?: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Header desktop */}
      <header className="sticky top-0 z-40 hidden border-b border-edge bg-surface/90 backdrop-blur md:block">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-6">
          <Link href="/" className="text-lg font-extrabold tracking-tight">
            Fantasy<span className="text-accent">L1</span>
          </Link>
          <nav className="flex gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-surface-raised hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          {authEnabled ? (
            <div className="ml-auto">
              <UserButton />
            </div>
          ) : null}
        </div>
      </header>

      {/* Bottom navigation mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-surface/95 backdrop-blur md:hidden">
        <div className="flex items-stretch pb-[env(safe-area-inset-bottom)]">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

type IconProps = { className?: string };

function ShirtIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 3 4 6l2 4 2-1v11h8V9l2 1 2-4-5-3a3 3 0 0 1-6 0Z" />
    </svg>
  );
}

function TransfersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8h13m0 0-3-3m3 3-3 3M20 16H7m0 0 3-3m-3 3 3 3" />
    </svg>
  );
}

function TrophyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 21h8m-4-4v4m-6-17h12v5a6 6 0 0 1-12 0V4Z" />
      <path d="M6 6H3v2a3 3 0 0 0 3 3m12-5h3v2a3 3 0 0 1-3 3" />
    </svg>
  );
}

function RankingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 20V10m7 10V4m7 16v-7" />
    </svg>
  );
}
