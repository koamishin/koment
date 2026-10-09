/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */
import type { NextRequest } from "next/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createTRPCContext } from "@saasfly/api";
import { edgeRouter } from "@saasfly/api/edge";
import { getSafeClerkAuth } from "@saasfly/auth";

// export const runtime = "edge";
export const dynamic = "force-dynamic";
const createContext = async (req: NextRequest) => {
  const auth = await getSafeClerkAuth(req.headers);
  return createTRPCContext({
    headers: req.headers,
    auth: auth as any,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc/edge",
    router: edgeRouter,
    req: req,
    createContext: () => createContext(req),
    onError: ({ error, path }) => {
      console.log("Error in tRPC handler (edge) on path", path);
      console.error(error);
    },
  });

export { handler as GET, handler as POST };
