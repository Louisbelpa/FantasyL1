import { redirect } from "next/navigation";

/**
 * Authentification Clerk, activée par la présence des clés dans
 * l'environnement. Sans clés (dev local), l'application fonctionne en
 * mode mono-utilisateur avec un manager local unique.
 */
export function isAuthEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY,
  );
}

const LOCAL_USER_ID = "local-dev";

/**
 * Id de l'utilisateur courant. Redirige vers la page de connexion si
 * Clerk est activé et que personne n'est connecté — utilisable dans
 * les pages comme dans les Server Actions.
 */
export async function requireUserId(): Promise<string> {
  if (!isAuthEnabled()) return LOCAL_USER_ID;
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) redirect("/connexion");
  return userId;
}
