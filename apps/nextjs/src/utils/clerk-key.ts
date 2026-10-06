import { parsePublishableKey } from "@clerk/shared/keys";

export const FALLBACK_CLERK_PUBLISHABLE_KEY =
  "pk_test_bW9jay1jbGVyay1pbnN0YW5jZS5hY2NvdW50cy5kZXYk";

/**
 * Sanitizes and repairs Clerk publishable keys that may contain trailing
 * malformed characters (e.g., from copy-paste typos like '$v') or invalid whitespace.
 * Always returns a publishable key that passes Clerk's parser.
 */
export function sanitizeClerkPublishableKey(
  key: string | undefined | null,
): string {
  if (!key || typeof key !== "string") {
    return FALLBACK_CLERK_PUBLISHABLE_KEY;
  }
  const trimmed = key.trim();
  if (!trimmed) {
    return FALLBACK_CLERK_PUBLISHABLE_KEY;
  }

  // Fast path: already valid according to Clerk's parser
  if (parsePublishableKey(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/^(pk_test_|pk_live_)(.+)$/);
  if (!match?.[1] || !match?.[2]) {
    return FALLBACK_CLERK_PUBLISHABLE_KEY;
  }

  const prefix = match[1];
  let rawPayload = match[2];

  const decode = (str: string): string => {
    if (typeof Buffer !== "undefined") {
      try {
        return Buffer.from(str, "base64").toString("utf-8");
      } catch {
        // Fall through
      }
    }
    let s = str;
    while (s.length > 0) {
      try {
        return atob(s);
      } catch {
        s = s.slice(0, -1);
      }
    }
    return "";
  };

  const encode = (str: string): string => {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(str, "utf-8").toString("base64");
    }
    return btoa(str);
  };

  // Attempt 1: Extract up to "$" in decoded payload and re-encode cleanly
  try {
    const decoded = decode(rawPayload);
    const dollarIndex = decoded.lastIndexOf("$");
    if (dollarIndex > 0) {
      const frontendApi = decoded.slice(0, dollarIndex);
      const repaired = `${prefix}${encode(`${frontendApi}$`)}`;
      if (parsePublishableKey(repaired)) {
        return repaired;
      }
    }
  } catch {
    // Fall through
  }

  // Attempt 2: Trim trailing invalid base64 characters
  while (rawPayload.length > 0) {
    rawPayload = rawPayload.slice(0, -1);
    const candidate = `${prefix}${rawPayload}`;
    if (parsePublishableKey(candidate)) {
      return candidate;
    }
  }

  return FALLBACK_CLERK_PUBLISHABLE_KEY;
}
