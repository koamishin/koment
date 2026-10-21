#!/usr/bin/env bun
/**
 * Local development entrypoint for the `@saasfly/stripe` package.
 *
 * Forwarding Stripe webhooks to a local server requires the Stripe CLI, an
 * optional external binary that is not installed on every machine (and that
 * additionally needs valid Stripe credentials to run `stripe listen`).
 *
 * A missing/failing Stripe CLI must never take down the rest of the `turbo dev`
 * stack, so this script:
 *   - runs `stripe listen` when the CLI is available,
 *   - prints actionable instructions and exits successfully when it is not,
 *   - never propagates a non-zero exit code to Turbo.
 */
import { spawn } from "node:child_process";
import { accessSync, constants, existsSync, readFileSync } from "node:fs";
import { delimiter, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
);
const REPO_ROOT = resolve(PACKAGE_ROOT, "../..");

/** Locate an executable the same way a shell would (`command -v`). */
function which(command: string): string | undefined {
  const pathEnv = process.env.PATH ?? "";
  const extensions =
    process.platform === "win32"
      ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";")
      : [""];

  for (const dir of pathEnv.split(delimiter)) {
    if (!dir) continue;

    for (const extension of extensions) {
      const candidate = join(dir, `${command}${extension}`);

      try {
        accessSync(candidate, constants.X_OK);
        return candidate;
      } catch {
        // Not executable (or missing) - keep looking.
      }
    }
  }

  return undefined;
}

/**
 * Best-effort read of a `KEY=value` pair from the repo level `.env.local`
 * so the webhook target matches the app URL used by the rest of the stack.
 */
function readEnvValue(key: string): string | undefined {
  const envFile = resolve(REPO_ROOT, ".env.local");
  if (!existsSync(envFile)) return undefined;

  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(
      line,
    );
    if (!match) continue;

    const [, matchedKey, rawValue] = match;
    if (matchedKey !== key) continue;

    return rawValue?.trim().replace(/^["'](.*)["']$/, "$1") ?? "";
  }

  return undefined;
}

/** Return the first value that is set and not blank. */
function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    if (value?.trim()) return value.trim();
  }

  return undefined;
}

function resolveForwardUrl(): string {
  const appUrl =
    firstNonEmpty(
      process.env.NEXT_PUBLIC_APP_URL,
      readEnvValue("NEXT_PUBLIC_APP_URL"),
    ) ?? "http://localhost:3000";

  return `${appUrl.replace(/\/+$/, "")}/api/webhooks/stripe`;
}

const cli = which("stripe");

if (!cli) {
  console.log(
    [
      "[stripe] Stripe CLI not found - skipping local webhook forwarding.",
      "[stripe] Install it with `brew install stripe/stripe-cli/stripe`",
      "[stripe] or see https://docs.stripe.com/stripe-cli for other platforms.",
      "[stripe] The rest of the dev stack keeps running; webhooks are simply",
      "[stripe] not delivered locally until the CLI is installed.",
    ].join("\n"),
  );
  process.exit(0);
}

const forwardTo = resolveForwardUrl();
console.log(`[stripe] Forwarding Stripe webhooks to ${forwardTo}`);

const child = spawn(
  cli,
  ["listen", "--all-snapshot", "--forward-to", forwardTo],
  {
    stdio: "inherit",
  },
);

child.on("error", (error) => {
  console.log(`[stripe] Failed to start \`stripe listen\`: ${error.message}`);
});

child.on("exit", (code) => {
  if (code !== 0) {
    console.log(
      [
        `[stripe] \`stripe listen\` exited with code ${code} - skipping local webhook forwarding.`,
        "[stripe] Check that the Stripe CLI is logged in and that STRIPE_API_KEY is valid.",
      ].join("\n"),
    );
  }

  // Exit successfully so an unavailable Stripe CLI never cancels the other
  // persistent `dev` tasks managed by Turbo.
  process.exit(0);
});
