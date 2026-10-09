import { getSafeClerkAuth, getSessionUser } from "./clerk";
import {
  FALLBACK_CLERK_PUBLISHABLE_KEY,
  sanitizeClerkPublishableKey,
} from "./clerk-key";

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isAdmin?: boolean;
}

declare global {
  interface CustomJwtSessionClaims {
    user?: User & {
      id: string;
      isAdmin: boolean;
    };
  }
}

export const authOptions = {
  pages: {
    signIn: "/login-clerk",
  },
};

export async function getCurrentUser(): Promise<User | undefined> {
  return await getSessionUser();
}

export {
  getSafeClerkAuth,
  sanitizeClerkPublishableKey,
  FALLBACK_CLERK_PUBLISHABLE_KEY,
};
