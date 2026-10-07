/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */

import type { NextRequest } from "next/server";
import NextAuth from "next-auth";

import { authOptions } from "@saasfly/auth";

export const dynamic = "force-dynamic";

const localHandler = NextAuth(authOptions as any);

async function handler(req: NextRequest, ctx: any) {
  if (process.env.AUTH_PROXY_URL) {
    const targetUrl = new URL(
      req.nextUrl.pathname + req.nextUrl.search,
      process.env.AUTH_PROXY_URL,
    );
    const headers = new Headers(req.headers);
    headers.set("x-forwarded-host", req.headers.get("host") ?? "");
    headers.set("x-forwarded-proto", req.nextUrl.protocol.replace(":", ""));

    const init: RequestInit = {
      method: req.method,
      headers,
      redirect: "manual",
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = await req.blob();
    }

    return await fetch(targetUrl, init);
  }

  return localHandler(req, ctx);
}

export { handler as GET, handler as POST };
