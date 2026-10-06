/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

import NextAuth from "next-auth";

import { authOptions } from "@saasfly/auth";

export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions as any);

export { handler as GET, handler as POST };
