export const SubscriptionPlan = {
  FREE: "FREE",
  PRO: "PRO",
  BUSINESS: "BUSINESS",
} as const;
export type SubscriptionPlan =
  (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];
export const Status = {
  PENDING: "PENDING",
  CREATING: "CREATING",
  INITING: "INITING",
  RUNNING: "RUNNING",
  STOPPED: "STOPPED",
  DELETED: "DELETED",
} as const;
export type Status = (typeof Status)[keyof typeof Status];
export const OrgRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  MEMBER: "MEMBER",
} as const;
export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];
export const EventStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  CANCELED: "CANCELED",
  COMPLETED: "COMPLETED",
} as const;
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];
export const RegistrationStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
  CANCELED: "CANCELED",
} as const;
export type RegistrationStatus =
  (typeof RegistrationStatus)[keyof typeof RegistrationStatus];
export const CheckInMethod = {
  QR: "QR",
  MANUAL: "MANUAL",
} as const;
export type CheckInMethod = (typeof CheckInMethod)[keyof typeof CheckInMethod];
export const FieldType = {
  TEXT: "TEXT",
  TEXTAREA: "TEXTAREA",
  NUMBER: "NUMBER",
  EMAIL: "EMAIL",
  PHONE: "PHONE",
  DATE: "DATE",
  SELECT: "SELECT",
  CHECKBOX: "CHECKBOX",
} as const;
export type FieldType = (typeof FieldType)[keyof typeof FieldType];
export const MatchStatus = {
  PENDING: "PENDING",
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
  COMPLETED: "COMPLETED",
} as const;
export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];
export const TournamentStatus = {
  DRAFT: "DRAFT",
  REGISTRATION: "REGISTRATION",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED",
} as const;
export type TournamentStatus =
  (typeof TournamentStatus)[keyof typeof TournamentStatus];
export const TournamentType = {
  SINGLE_ELIMINATION: "SINGLE_ELIMINATION",
  DOUBLE_ELIMINATION: "DOUBLE_ELIMINATION",
  ROUND_ROBIN: "ROUND_ROBIN",
  SWISS: "SWISS",
} as const;
export type TournamentType =
  (typeof TournamentType)[keyof typeof TournamentType];
