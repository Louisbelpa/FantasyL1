import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import NavBar from "@/components/navigation/NavBar";
import { isAuthEnabled } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Fantasy Ligue 1",
    template: "%s | Fantasy Ligue 1",
  },
  description:
    "Composez votre équipe fantasy de Ligue 1 : transferts, ligues entre amis et classements chaque journée.",
};

export const viewport: Viewport = {
  themeColor: "#0b0f19",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authEnabled = isAuthEnabled();

  const page = (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans pb-16 md:pb-0">
        <NavBar authEnabled={authEnabled} />
        {children}
        <footer className="border-t border-edge px-4 py-4 text-center text-xs text-muted">
          <Link href="/regles" className="hover:text-accent">
            Règles du jeu &amp; barème
          </Link>
          <span className="mx-2">·</span>
          Fantasy Ligue 1 — MVP, données fictives ou fournies par API-Football
        </footer>
      </body>
    </html>
  );

  return authEnabled ? <ClerkProvider>{page}</ClerkProvider> : page;
}
