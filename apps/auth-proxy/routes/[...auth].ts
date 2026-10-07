import { Auth } from "@auth/core";
import GitHub from "@auth/core/providers/github";
import { eventHandler, toWebRequest } from "h3";

export default eventHandler(async (event) =>
  Auth(toWebRequest(event), {
    basePath: process.env.AUTH_BASE_PATH ?? "/api/auth",
    secret: process.env.AUTH_SECRET,
    trustHost: !!process.env.VERCEL,
    redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
    providers: [
      GitHub({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      }),
    ],
  }),
);
