import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { isAuthEnabled } from "@/lib/auth";

export const metadata: Metadata = { title: "Connexion" };

export default function ConnexionPage() {
  // Sans Clerk configuré, pas de connexion : mode mono-utilisateur.
  if (!isAuthEnabled()) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <SignIn routing="path" path="/connexion" />
    </main>
  );
}
