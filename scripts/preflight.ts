#!/usr/bin/env bun
/**
 * Preflight check for `bun run dev`.
 *
 * The Next.js dev server is pinned to a fixed port (see `PORT` in `.env.local`)
 * so the app URL stays stable. Next.js only falls back to another port when
 * neither `--port` nor `PORT` is set, so a port clash otherwise surfaces as a
 * raw `EADDRINUSE` stack trace from deep inside Next.
 *
 * This check turns that into an actionable message *before* Turbo starts.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

/** Best-effort read of a `KEY=value` pair from the repo level `.env.local`. */
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

function resolvePort(): number {
  const raw =
    process.env.PORT?.trim() || readEnvValue("PORT")?.trim() || "3000";
  const port = Number.parseInt(raw, 10);

  return Number.isNaN(port) ? 3000 : port;
}

/** Human readable name of a process, preferring `/proc` over the truncated `lsof` name. */
function describeProcess(pid: number, fallback: string): string {
  try {
    const argv = readFileSync(`/proc/${pid}/cmdline`, "utf8")
      .split("\0")
      .filter(Boolean);

    if (argv[0]) return argv[0];
  } catch {
    // `/proc` is not available (or the process already exited) - use the fallback.
  }

  return fallback;
}

/** Resolve the PID and command of the process listening on `port`. */
function findPortOwner(port: number): { pid: number; command: string } | null {
  const lsof = spawnSync(
    "lsof",
    ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-Fpc"],
    { encoding: "utf8" },
  );

  if (lsof.status === 0 && lsof.stdout) {
    let pid: number | undefined;
    let command = "";

    for (const line of lsof.stdout.split("\n")) {
      if (line.startsWith("p")) pid = Number.parseInt(line.slice(1), 10);
      if (line.startsWith("c")) command = line.slice(1);
    }

    if (pid) return { pid, command: describeProcess(pid, command) };
  }

  const ss = spawnSync("ss", ["-ltnpH", `sport = :${port}`], {
    encoding: "utf8",
  });

  if (ss.status === 0 && ss.stdout) {
    const match = ss.stdout.match(/users:\(\("([^"]+)",pid=(\d+)/);

    if (match?.[1] && match[2]) {
      const pid = Number.parseInt(match[2], 10);
      return { pid, command: describeProcess(pid, match[1]) };
    }
  }

  return null;
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolveFree) => {
    const server = createServer();

    server.once("error", () => resolveFree(false));
    server.once("listening", () => {
      server.close(() => resolveFree(true));
    });

    server.listen(port, "0.0.0.0");
  });
}

const port = resolvePort();

if (!(await isPortFree(port))) {
  const owner = findPortOwner(port);

  console.log(
    [
      `[dev] Port ${port} is already in use, so the Next.js dev server cannot start.`,
      owner
        ? `[dev]   ${owner.command}  (pid ${owner.pid})`
        : "[dev]   owned by another process",
      "[dev] Stop the previous dev server:  kill " + (owner?.pid ?? "<pid>"),
      "[dev] Or use a different port: set PORT in .env.local",
    ].join("\n"),
  );

  process.exit(1);
}

process.exit(0);
