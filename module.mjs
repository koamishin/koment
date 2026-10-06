// @ts-check
import { module } from "@prisma/composer";
import nextjsService from "./apps/nextjs/service.mjs";

export default module("koment", ({ provision }) => {
  provision(nextjsService);
});
