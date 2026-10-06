import { SubscriptionPlan } from "@saasfly/db";

export const UNLIMITED = -1;

export interface PlanEntitlements {
  maxEvents: number;
  maxCustomFields: number;
  maxMembers: number;
  canCustomFields: boolean;
  canApproveRegistrations: boolean;
  canQrCheckIn: boolean;
  canCsvExport: boolean;
}

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlan, PlanEntitlements> = {
  [SubscriptionPlan.FREE]: {
    maxEvents: 1,
    maxCustomFields: 0,
    maxMembers: 1,
    canCustomFields: false,
    canApproveRegistrations: false,
    canQrCheckIn: false,
    canCsvExport: false,
  },
  [SubscriptionPlan.PRO]: {
    maxEvents: 5,
    maxCustomFields: 10,
    maxMembers: 25,
    canCustomFields: true,
    canApproveRegistrations: false,
    canQrCheckIn: true,
    canCsvExport: false,
  },
  [SubscriptionPlan.BUSINESS]: {
    maxEvents: UNLIMITED,
    maxCustomFields: UNLIMITED,
    maxMembers: UNLIMITED,
    canCustomFields: true,
    canApproveRegistrations: true,
    canQrCheckIn: true,
    canCsvExport: true,
  },
};

export function getPlanEntitlements(
  plan: SubscriptionPlan | null | undefined,
): PlanEntitlements {
  return (
    PLAN_ENTITLEMENTS[plan ?? SubscriptionPlan.FREE] ??
    PLAN_ENTITLEMENTS[SubscriptionPlan.FREE]
  );
}

export function isWithinQuota(used: number, limit: number): boolean {
  if (limit === UNLIMITED) {
    return true;
  }
  return used < limit;
}
