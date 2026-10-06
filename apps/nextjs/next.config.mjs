// @ts-check
import "./src/env.mjs";
import "@saasfly/auth/env.mjs";

import { parsePublishableKey } from "@clerk/shared/keys";
import { withNextDevtools } from "@next-devtools/core/plugin";
// import "@saasfly/api/env"
import withMDX from "@next/mdx";

const FALLBACK_CLERK_KEY = "pk_test_bW9jay1jbGVyay1pbnN0YW5jZS5hY2NvdW50cy5kZXYk";

/**
 * @param {string | undefined | null} [key]
 * @returns {string}
 */
function sanitizeClerkKey(key) {
  if (!key || typeof key !== "string") return FALLBACK_CLERK_KEY;
  const trimmed = key.trim();
  if (!trimmed) return FALLBACK_CLERK_KEY;
  if (parsePublishableKey(trimmed)) return trimmed;
  const match = trimmed.match(/^(pk_test_|pk_live_)(.+)$/);
  if (!match?.[1] || !match?.[2]) return FALLBACK_CLERK_KEY;
  const prefix = match[1];
  let rawPayload = match[2];
  try {
    const decoded = Buffer.from(rawPayload, "base64").toString("utf-8");
    const dollarIndex = decoded.lastIndexOf("$");
    if (dollarIndex > 0) {
      const frontendApi = decoded.slice(0, dollarIndex);
      const repaired = `${prefix}${Buffer.from(`${frontendApi}$`).toString("base64")}`;
      if (parsePublishableKey(repaired)) return repaired;
    }
  } catch (_err) {
    // Ignore decode error and try trimming
  }
  while (rawPayload.length > 0) {
    rawPayload = rawPayload.slice(0, -1);
    const candidate = `${prefix}${rawPayload}`;
    if (parsePublishableKey(candidate)) return candidate;
  }
  return FALLBACK_CLERK_KEY;
}

if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = sanitizeClerkKey(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
}

!process.env.SKIP_ENV_VALIDATION && (await import("./src/env.mjs"));

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@saasfly/api",
    "@saasfly/auth",
    "@saasfly/db",
    "@saasfly/common",
    "@saasfly/ui",
    "@saasfly/stripe",
  ],
  pageExtensions: ["ts", "tsx", "mdx"],
  experimental: {
    mdxRs: true,
    // Keep the Postgres driver out of the server bundle: pg ships optional
    // native bindings and kysely resolves its dialect at runtime.
    serverComponentsExternalPackages: ["pg", "kysely"],
    // serverActions: true,
  },
  images: {
    domains: [
      "images.unsplash.com",
      "avatars.githubusercontent.com",
      "www.twillot.com",
      "cdnv2.ruguoapp.com",
      "www.setupyourpay.com",
    ],
  },
  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  output: "standalone",
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: sanitizeClerkKey(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    ),
  },
};

export default withNextDevtools(withMDX()(config));
