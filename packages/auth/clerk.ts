import type { User } from "./index";
import { auth, createClerkClient } from "@clerk/nextjs/server";

import { env } from "./env.mjs";
import { sanitizeClerkPublishableKey } from "./clerk-key";

function resolveIsAdmin(email: string | null | undefined): boolean {
  if (!email || !env.ADMIN_EMAIL) {
    return false;
  }
  return env.ADMIN_EMAIL.split(",").includes(email);
}

export interface SafeAuthResult {
  userId: string | null;
  sessionClaims: Record<string, unknown> | null;
}

export async function getSafeClerkAuth(
  customHeaders?: Headers,
): Promise<SafeAuthResult> {
  // 1. If clerkMiddleware ran on the request, standard auth() succeeds immediately.
  try {
    const rawAuth = await auth();
    if (rawAuth?.userId) {
      return {
        userId: rawAuth.userId,
        sessionClaims:
          (rawAuth.sessionClaims as Record<string, unknown> | null) ?? null,
      };
    }
    return {
      userId: null,
      sessionClaims: null,
    };
  } catch {
    // 2. Fall back to direct backend token verification (e.g. on Vercel Services where Edge middleware is disabled).
    try {
      let reqHeaders: Headers;
      if (customHeaders) {
        reqHeaders = customHeaders;
      } else {
        const { headers: nextHeaders } = await import("next/headers");
        reqHeaders = nextHeaders();
      }

      const publishableKey = sanitizeClerkPublishableKey(
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
          process.env.CLERK_PUBLISHABLE_KEY,
      );
      const secretKey =
        process.env.CLERK_SECRET_KEY || "sk_test_mock_clerk_secret_key";

      const client = createClerkClient({
        publishableKey,
        secretKey,
      });

      const req = new Request("https://placeholder.internal", {
        headers: reqHeaders,
      });

      const authResult = await client.authenticateRequest(req);
      const authObj = authResult?.toAuth?.();
      return {
        userId: authObj?.userId ?? null,
        sessionClaims:
          (authObj?.sessionClaims as Record<string, unknown> | null) ?? null,
      };
    } catch {
      return {
        userId: null,
        sessionClaims: null,
      };
    }
  }
}

export async function getSessionUser(): Promise<User | undefined> {
  const { userId, sessionClaims } = await getSafeClerkAuth();

  if (!userId) {
    return undefined;
  }

  // Fast path: deployments that customized the Clerk session token to embed
  // a `user` claim keep working exactly as before.
  if (sessionClaims?.user && typeof sessionClaims.user === "object") {
    const user = sessionClaims.user as User;
    if (user.id) {
      if (user.email) {
        user.isAdmin = resolveIsAdmin(user.email);
      }
      return user;
    }
  }

  // Default Clerk session tokens carry no `user` claim, so build the session
  // user from the Clerk Backend API instead of returning undefined.
  try {
    const publishableKey = sanitizeClerkPublishableKey(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
        process.env.CLERK_PUBLISHABLE_KEY,
    );
    const secretKey =
      process.env.CLERK_SECRET_KEY || "sk_test_mock_clerk_secret_key";
    const client = createClerkClient({
      publishableKey,
      secretKey,
    });
    const clerkUser = await client.users.getUser(userId);
    if (!clerkUser) {
      return undefined;
    }

    const email =
      clerkUser.emailAddresses?.find(
        (address) => address.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress ??
      clerkUser.emailAddresses?.[0]?.emailAddress ??
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
  } catch (err) {
    console.warn("Failed to fetch user profile via Clerk client:", err);
    return undefined;
  }
}
