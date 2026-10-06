import { auth, currentUser } from "@clerk/nextjs/server";

import { env } from "./env.mjs";

function resolveIsAdmin(email: string | null | undefined): boolean {
  if (!email || !env.ADMIN_EMAIL) {
    return false;
  }
  return env.ADMIN_EMAIL.split(",").includes(email);
}

export async function getSessionUser() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return undefined;
  }

  // Fast path: deployments that customized the Clerk session token to embed
  // a `user` claim keep working exactly as before.
  if (sessionClaims?.user?.id) {
    if (sessionClaims.user.email) {
      sessionClaims.user.isAdmin = resolveIsAdmin(sessionClaims.user.email);
    }
    return sessionClaims.user;
  }

  // Default Clerk session tokens carry no `user` claim, so build the session
  // user from the Clerk Backend API instead of returning undefined.
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return undefined;
  }

  const email =
    clerkUser.emailAddresses.find(
      (address) => address.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null;

  const fullName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    null;

  return {
    id: clerkUser.id,
    email,
    name: fullName,
    image: clerkUser.imageUrl ?? null,
    isAdmin: resolveIsAdmin(email),
  };
}
