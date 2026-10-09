import { match as matchLocale } from "@formatjs/intl-localematcher";
import {
  clerkMiddleware,
  createRouteMatcher,
  currentUser,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import Negotiator from "negotiator";

import { i18n } from "~/config/i18n-config";
import { sanitizeClerkPublishableKey } from "./clerk-key";

const publishableKey = sanitizeClerkPublishableKey(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

if (!process.env.CLERK_SECRET_KEY) {
  process.env.CLERK_SECRET_KEY = "sk_test_mock_clerk_secret_key";
}

const noNeedProcessRoute = [".*\\.png", ".*\\.jpg", ".*\\.opengraph-image.png"];

const noRedirectRoute = ["/api(.*)", "/trpc(.*)", "/admin"];

export const isPublicRoute = createRouteMatcher([
  new RegExp("^/$"),
  new RegExp("^/\\w{2}/?$"),
  new RegExp("/(\\w{2}/)?(signin|login|register|login-clerk)(.*)"),
  new RegExp("/(\\w{2}/)?terms(.*)"),
  new RegExp("/(\\w{2}/)?privacy(.*)"),
  new RegExp("/(\\w{2}/)?docs(.*)"),
  new RegExp("/(\\w{2}/)?blog(.*)"),
  new RegExp("/(\\w{2}/)?pricing(.*)"),
  // Public event and tournament discovery + detail. Anchored to the top level so it cannot
  // match tenant routes such as /dashboard/organizations/:id/events/:id.
  new RegExp("^/\\w{2}/?events(/.*)?$|^/events(/.*)?$"),
  new RegExp("^/\\w{2}/?tournaments(/.*)?$|^/tournaments(/.*)?$"),
]);

export function getLocale(request: NextRequest): string | undefined {
  // Negotiator expects plain object so we need to transform headers
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));
  const locales = Array.from(i18n.locales);
  // Use negotiator and intl-localematcher to get best locale
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(
    locales,
  );
  return matchLocale(languages, locales, i18n.defaultLocale);
}

export function isNoRedirect(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return noRedirectRoute.some((route) => new RegExp(route).test(pathname));
}

export function isNoNeedProcess(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return noNeedProcessRoute.some((route) => new RegExp(route).test(pathname));
}

const clerkHandler = clerkMiddleware(
  async (auth, req: NextRequest) => {
    if (isNoNeedProcess(req)) {
      return null;
    }

    const isWebhooksRoute = req.nextUrl.pathname.startsWith("/api/webhooks/");
    if (isWebhooksRoute) {
      return NextResponse.next();
    }
    const pathname = req.nextUrl.pathname;
    // Check if there is any supported locale in the pathname
    const pathnameIsMissingLocale = i18n.locales.every(
      (locale) =>
        !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
    );
    // Redirect if there is no locale
    if (!isNoRedirect(req) && pathnameIsMissingLocale) {
      const locale = getLocale(req);
      return NextResponse.redirect(
        new URL(
          `/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`,
          req.url,
        ),
      );
    }

    if (isPublicRoute(req)) {
      return null;
    }

    let isAuth = false;
    let userClaims: Record<string, unknown> | null = null;
    try {
      const authData = await auth();
      isAuth = Boolean(authData.userId);
      userClaims =
        (authData.sessionClaims as Record<string, unknown> | null) ?? null;
    } catch {
      isAuth = false;
    }

    async function resolveIsAdmin(): Promise<boolean> {
      const adminEmailConfig = process.env.ADMIN_EMAIL;
      if (!adminEmailConfig) {
        return false;
      }
      const adminEmails = adminEmailConfig.split(",");
      // Fast path for deployments with a customized session token.
      const sessionUser = userClaims?.user as
        | { email?: string }
        | undefined;
      if (sessionUser?.email) {
        return adminEmails.includes(sessionUser.email);
      }
      // Default Clerk session tokens carry no `user` claim, so fall back to
      // the Backend API. Only the admin route pays for this lookup.
      try {
        const clerkUser = await currentUser();
        const email =
          clerkUser?.emailAddresses.find(
            (address) => address.id === clerkUser.primaryEmailAddressId,
          )?.emailAddress ??
          clerkUser?.emailAddresses[0]?.emailAddress ??
          null;
        return !!email && adminEmails.includes(email);
      } catch {
        return false;
      }
    }
  const isAuthPage = /^\/[a-zA-Z]{2,}\/(login|register|login-clerk)/.test(
    req.nextUrl.pathname,
  );
  // Handlers that own their own authorization must not be HTML-redirected:
  // tRPC uses protectedProcedure (and public procedures for event discovery),
  // and the CSV export returns 401. /api/auth is deliberately left on the
  // legacy path because the bundled NextAuth config is a stub.
  const isSelfAuthorizingApiRoute =
    req.nextUrl.pathname.startsWith("/api/trpc/") ||
    req.nextUrl.pathname.startsWith("/trpc/") ||
    req.nextUrl.pathname.startsWith("/api/events/");
  const locale = getLocale(req);
  if (isSelfAuthorizingApiRoute) {
    return NextResponse.next();
  }
  if (req.nextUrl.pathname.startsWith("/admin/dashboard")) {
    if (!isAuth || !(await resolveIsAdmin()))
      return NextResponse.redirect(new URL(`/admin/login`, req.url));
    return NextResponse.next();
  }
  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
    }
    return null;
  }
  if (!isAuth) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }
    return NextResponse.redirect(
      new URL(
        `/${locale}/login-clerk?from=${encodeURIComponent(from)}`,
        req.url,
      ),
    );
  }
  },
  {
    publishableKey,
  },
);

export const middleware = async (
  req: NextRequest,
  event: NextFetchEvent,
): Promise<NextResponse | Response | null | void> => {
  if (isNoNeedProcess(req)) {
    return null;
  }

  const isWebhooksRoute = req.nextUrl.pathname.startsWith("/api/webhooks/");
  if (isWebhooksRoute) {
    return NextResponse.next();
  }

  // 1. Break redirect loops by stripping broken handshake query parameters
  if (
    req.nextUrl.searchParams.has("__clerk_handshake") ||
    req.nextUrl.searchParams.has("__clerk_help")
  ) {
    const cleanUrl = new URL(req.url);
    cleanUrl.searchParams.delete("__clerk_handshake");
    cleanUrl.searchParams.delete("__clerk_help");
    const res = NextResponse.redirect(cleanUrl);
    res.cookies.set("__clerk_db_jwt", "mock_dev_browser_jwt", {
      path: "/",
      sameSite: "lax",
    });
    return res;
  }

  const pathname = req.nextUrl.pathname;

  // 2. Normalize and redirect missing locale directly to /${locale} (avoiding trailing-slash hops)
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) =>
      !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  );
  if (!isNoRedirect(req) && pathnameIsMissingLocale) {
    const locale = getLocale(req) ?? "en";
    const targetPath =
      pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    return NextResponse.redirect(new URL(targetPath, req.url));
  }

  // 3. Prevent dev-browser cross-origin handshake redirect loops on public/deployed hosts:
  // In development mode, Clerk attempts to redirect browsers without `__clerk_db_jwt` to accounts.dev.
  // Injecting a dev-browser cookie prevents Clerk from issuing 307 redirects to accounts.dev while
  // still populating all required auth headers for Server Components.
  if (!req.cookies.get("__clerk_db_jwt")) {
    req.cookies.set("__clerk_db_jwt", "mock_dev_browser_jwt");
  }

  // 4. Run Clerk authentication
  try {
    const res = await clerkHandler(req, event);
    if (res instanceof Response) {
      const location = res.headers.get("location");
      // If Clerk attempts to redirect to accounts.dev for a dev handshake on a public route, intercept it
      if (
        location &&
        (location.includes("clerk.accounts.dev") ||
          location.includes("/handshake")) &&
        isPublicRoute(req)
      ) {
        return NextResponse.next();
      }
    }
    return res;
  } catch (err) {
    console.error("Clerk middleware error caught:", err);
    return NextResponse.next();
  }
};
