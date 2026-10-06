// @ts-check
import { module } from "@prisma/composer";
import nextjsService from "./apps/nextjs/service.mjs";
import authService from "./packages/auth/service.mjs";

export default module("koment", ({ provision }) => {
  provision(nextjsService);
  provision(authService);
});
