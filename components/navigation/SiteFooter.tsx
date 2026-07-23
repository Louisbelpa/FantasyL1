"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Footer applicatif, masqué sur la landing publique (habillage propre). */
export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/accueil") return null;

  return (
    <footer className="border-t border-edge px-4 py-4 text-center text-xs text-muted">
      <Link href="/regles" className="hover:text-accent">
        Règles du jeu &amp; barème
      </Link>
      <span className="mx-2">·</span>
      Fantasy Ligue 1 — MVP, données fictives ou fournies par API-Football
    </footer>
  );
}
