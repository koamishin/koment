import type { ColumnType } from "kysely";

import type {
  CheckInMethod,
  EventStatus,
  FieldType,
  MatchStatus,
  OrgRole,
  RegistrationStatus,
  Status,
  SubscriptionPlan,
  TournamentStatus,
  TournamentType,
} from "./enums";

export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Account = {
  id: Generated<string>;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
};
export type Customer = {
  id: Generated<number>;
  authUserId: string;
  name: string | null;
  plan: SubscriptionPlan | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: Timestamp | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
};
export type Event = {
  id: Generated<number>;
  organizationId: number;
  authUserId: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  coverImage: string | null;
  startsAt: Timestamp;
  endsAt: Timestamp | null;
  capacity: number | null;
  status: Generated<EventStatus>;
  requireApproval: Generated<boolean>;
  isPublic: Generated<boolean>;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
};
export type K8sClusterConfig = {
  id: Generated<number>;
  name: string;
  location: string;
  authUserId: string;
  plan: Generated<SubscriptionPlan | null>;
  network: string | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
  status: Generated<Status | null>;
  delete: Generated<boolean | null>;
};
export type Organization = {
  id: Generated<number>;
  name: string;
  slug: string;
  joinCode: string;
  authUserId: string;
  plan: Generated<SubscriptionPlan>;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
};
export type OrgMember = {
  id: Generated<number>;
  organizationId: number;
  authUserId: string;
  email: string;
  name: string | null;
  role: Generated<OrgRole>;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
};
export type Registration = {
  id: Generated<number>;
  eventId: number;
  organizationId: number;
  authUserId: string;
  name: string;
  email: string;
  phone: string | null;
  status: Generated<RegistrationStatus>;
  answers: unknown | null;
  checkInCode: string;
  checkedInAt: Timestamp | null;
  checkInMethod: CheckInMethod | null;
  checkedInBy: string | null;
  note: string | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
};
export type RegistrationField = {
  id: Generated<number>;
  eventId: number;
  key: string;
  label: string;
  type: Generated<FieldType>;
  options: string | null;
  required: Generated<boolean>;
  position: Generated<number>;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
};
export type Session = {
  id: Generated<string>;
  sessionToken: string;
  userId: string;
  expires: Timestamp;
};
export type Tournament = {
  id: Generated<number>;
  organizationId: number;
  eventId: number | null;
  authUserId: string;
  name: string;
  slug: string;
  description: string | null;
  game: string;
  gameFormat: Generated<string>;
  tournamentType: Generated<TournamentType>;
  status: Generated<TournamentStatus>;
  prizePool: string | null;
  rules: string | null;
  maxTeams: Generated<number>;
  matchType: Generated<string>;
  coverImage: string | null;
  streamUrl: string | null;
  startsAt: Timestamp;
  endsAt: Timestamp | null;
  isPublic: Generated<boolean>;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
};
export type TournamentMatch = {
  id: Generated<number>;
  tournamentId: number;
  round: number;
  matchNumber: number;
  stage: Generated<string>;
  team1Id: number | null;
  team2Id: number | null;
  team1Score: Generated<number>;
  team2Score: Generated<number>;
  winnerId: number | null;
  nextMatchId: number | null;
  status: Generated<MatchStatus>;
  scheduledAt: Timestamp | null;
  vodUrl: string | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
};
export type TournamentTeam = {
  id: Generated<number>;
  tournamentId: number;
  authUserId: string | null;
  name: string;
  tag: string | null;
  logo: string | null;
  captainName: string;
  captainEmail: string;
  captainDiscord: string | null;
  seed: number | null;
  players: unknown | null;
  status: Generated<string>;
  checkInCode: Generated<string>;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
};
export type User = {
  id: Generated<string>;
  name: string | null;
  email: string | null;
  emailVerified: Timestamp | null;
  image: string | null;
};
export type VerificationToken = {
  identifier: string;
  token: string;
  expires: Timestamp;
};
export type DB = {
  Account: Account;
  Customer: Customer;
  Event: Event;
  K8sClusterConfig: K8sClusterConfig;
  Organization: Organization;
  OrgMember: OrgMember;
  Registration: Registration;
  RegistrationField: RegistrationField;
  Session: Session;
  Tournament: Tournament;
  TournamentMatch: TournamentMatch;
  TournamentTeam: TournamentTeam;
  User: User;
  VerificationToken: VerificationToken;
};
