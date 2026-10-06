import { authRouter } from "./router/auth";
import { checkInRouter } from "./router/check-in";
import { customerRouter } from "./router/customer";
import { eventRouter } from "./router/event";
import { helloRouter } from "./router/health_check";
import { k8sRouter } from "./router/k8s";
import { organizationRouter } from "./router/organization";
import { registrationRouter } from "./router/registration";
import { stripeRouter } from "./router/stripe";
import { tournamentRouter } from "./router/tournament";
import { createTRPCRouter } from "./trpc";

export const edgeRouter = createTRPCRouter({
  stripe: stripeRouter,
  hello: helloRouter,
  k8s: k8sRouter,
  auth: authRouter,
  customer: customerRouter,
  organization: organizationRouter,
  event: eventRouter,
  tournament: tournamentRouter,
  registration: registrationRouter,
  checkIn: checkInRouter,
});
