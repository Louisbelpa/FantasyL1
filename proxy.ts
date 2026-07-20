import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Clerk n'est branché que si ses clés sont configurées ; sinon le
// proxy est transparent et l'app tourne en mode mono-utilisateur.
const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export default clerkEnabled
  ? clerkMiddleware()
  : function proxy() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    // Tout sauf les internals Next et les fichiers statiques.
    "/((?!_next|.*\\.(?:ico|png|svg|jpg|jpeg|webp|css|js|woff2?)$).*)",
  ],
};
