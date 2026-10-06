import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  db,
  MatchStatus,
  OrgRole,
  RegistrationStatus,
  TournamentStatus,
  TournamentType,
} from "@saasfly/db";

import { requireOrgRole } from "../permissions";
import { randomCheckInCode, randomSlugSuffix, slugify } from "../slug";
import { createTRPCRouter, procedure, protectedProcedure } from "../trpc";

function getSeedOrder(size: number): number[] {
  const rounds = Math.log2(size) - 1;
  let pls = [1, 2];
  for (let i = 0; i < rounds; i++) {
    const nextPls: number[] = [];
    const sum = pls.length * 2 + 1;
    for (const p of pls) {
      nextPls.push(p);
      nextPls.push(sum - p);
    }
    pls = nextPls;
  }
  return pls;
}

const tournamentUpsertSchema = z.object({
  id: z.number().int().positive().optional(),
  organizationId: z.number().int().positive(),
  eventId: z.number().int().positive().optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(4000).optional(),
  game: z.string().min(1).max(80),
  gameFormat: z.string().min(1).max(20).default("5v5"),
  tournamentType: z.nativeEnum(TournamentType).default(TournamentType.SINGLE_ELIMINATION),
  status: z.nativeEnum(TournamentStatus).default(TournamentStatus.REGISTRATION),
  prizePool: z.string().max(80).optional(),
  rules: z.string().max(10000).optional(),
  maxTeams: z.number().int().min(4).max(128).default(16),
  matchType: z.string().max(20).default("BO3"),
  coverImage: z.string().max(1000).optional().or(z.literal("")),
  streamUrl: z.string().max(1000).optional().or(z.literal("")),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  isPublic: z.boolean().default(true),
});

const teamRegisterSchema = z.object({
  tournamentId: z.number().int().positive(),
  name: z.string().min(2).max(80),
  tag: z.string().max(8).optional(),
  logo: z.string().max(1000).optional().or(z.literal("")),
  captainName: z.string().min(2).max(80),
  captainEmail: z.string().email(),
  captainDiscord: z.string().max(50).optional(),
  players: z
    .array(
      z.object({
        name: z.string().min(1).max(60),
        role: z.string().max(30).optional(),
      }),
    )
    .optional(),
});

export const tournamentRouter = createTRPCRouter({
  listByOrganization: protectedProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      await requireOrgRole(input.organizationId, userId, OrgRole.STAFF);

      const tournaments = await db
        .selectFrom("Tournament")
        .selectAll()
        .where("organizationId", "=", input.organizationId)
        .orderBy("startsAt", "desc")
        .execute();

      const counts = await Promise.all(
        tournaments.map(async (t) => {
          const teams = await db
            .selectFrom("TournamentTeam")
            .select(db.fn.count("id").as("count"))
            .where("tournamentId", "=", t.id)
            .executeTakeFirst();
          const matches = await db
            .selectFrom("TournamentMatch")
            .select(db.fn.count("id").as("count"))
            .where("tournamentId", "=", t.id)
            .executeTakeFirst();
          return {
            tournamentId: t.id,
            teamsCount: Number(teams?.count ?? 0),
            matchesCount: Number(matches?.count ?? 0),
          };
        }),
      );

      const countMap = new Map(counts.map((c) => [c.tournamentId, c]));

      return tournaments.map((t) => ({
        ...t,
        teamsCount: countMap.get(t.id)?.teamsCount ?? 0,
        matchesCount: countMap.get(t.id)?.matchesCount ?? 0,
      }));
    }),

  listPublic: procedure
    .input(
      z
        .object({
          game: z.string().optional(),
          status: z.nativeEnum(TournamentStatus).optional(),
          search: z.string().optional(),
          limit: z.number().int().min(1).max(50).default(20),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      let query = db
        .selectFrom("Tournament")
        .innerJoin("Organization", "Organization.id", "Tournament.organizationId")
        .select([
          "Tournament.id",
          "Tournament.name",
          "Tournament.slug",
          "Tournament.description",
          "Tournament.game",
          "Tournament.gameFormat",
          "Tournament.tournamentType",
          "Tournament.status",
          "Tournament.prizePool",
          "Tournament.maxTeams",
          "Tournament.matchType",
          "Tournament.coverImage",
          "Tournament.streamUrl",
          "Tournament.startsAt",
          "Tournament.endsAt",
          "Organization.name as organizationName",
          "Organization.slug as organizationSlug",
        ])
        .where("Tournament.isPublic", "=", true)
        .where("Tournament.status", "!=", TournamentStatus.DRAFT);

      if (input?.game) {
        query = query.where("Tournament.game", "=", input.game);
      }
      if (input?.status) {
        query = query.where("Tournament.status", "=", input.status);
      }
      if (input?.search?.trim()) {
        const term = `%${input.search.trim().toLowerCase()}%`;
        query = query.where((eb) =>
          eb.or([
            eb("Tournament.name", "ilike", term),
            eb("Tournament.game", "ilike", term),
            eb("Organization.name", "ilike", term),
          ]),
        );
      }

      const rows = await query
        .orderBy("Tournament.startsAt", "desc")
        .limit(input?.limit ?? 20)
        .execute();

      const withCounts = await Promise.all(
        rows.map(async (t) => {
          const teams = await db
            .selectFrom("TournamentTeam")
            .select(db.fn.count("id").as("count"))
            .where("tournamentId", "=", t.id)
            .executeTakeFirst();
          return {
            ...t,
            teamsCount: Number(teams?.count ?? 0),
          };
        }),
      );

      return withCounts;
    }),

  getBySlug: procedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }) => {
      const tournament = await db
        .selectFrom("Tournament")
        .innerJoin("Organization", "Organization.id", "Tournament.organizationId")
        .select([
          "Tournament.id",
          "Tournament.organizationId",
          "Tournament.eventId",
          "Tournament.name",
          "Tournament.slug",
          "Tournament.description",
          "Tournament.game",
          "Tournament.gameFormat",
          "Tournament.tournamentType",
          "Tournament.status",
          "Tournament.prizePool",
          "Tournament.rules",
          "Tournament.maxTeams",
          "Tournament.matchType",
          "Tournament.coverImage",
          "Tournament.streamUrl",
          "Tournament.startsAt",
          "Tournament.endsAt",
          "Tournament.isPublic",
          "Tournament.createdAt",
          "Organization.name as organizationName",
          "Organization.slug as organizationSlug",
        ])
        .where("Tournament.slug", "=", input.slug)
        .executeTakeFirst();

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      const teams = await db
        .selectFrom("TournamentTeam")
        .selectAll()
        .where("tournamentId", "=", tournament.id)
        .orderBy("seed", "asc")
        .orderBy("createdAt", "asc")
        .execute();

      const matches = await db
        .selectFrom("TournamentMatch")
        .selectAll()
        .where("tournamentId", "=", tournament.id)
        .orderBy("round", "asc")
        .orderBy("matchNumber", "asc")
        .execute();

      return {
        tournament,
        teams,
        matches,
      };
    }),

  getById: protectedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        tournamentId: z.number().int().positive(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await requireOrgRole(input.organizationId, ctx.userId, OrgRole.STAFF);

      const tournament = await db
        .selectFrom("Tournament")
        .selectAll()
        .where("id", "=", input.tournamentId)
        .where("organizationId", "=", input.organizationId)
        .executeTakeFirst();

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      const teams = await db
        .selectFrom("TournamentTeam")
        .selectAll()
        .where("tournamentId", "=", tournament.id)
        .orderBy("seed", "asc")
        .orderBy("createdAt", "asc")
        .execute();

      const matches = await db
        .selectFrom("TournamentMatch")
        .selectAll()
        .where("tournamentId", "=", tournament.id)
        .orderBy("round", "asc")
        .orderBy("matchNumber", "asc")
        .execute();

      return {
        tournament,
        teams,
        matches,
      };
    }),

  upsert: protectedProcedure
    .input(tournamentUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      await requireOrgRole(input.organizationId, ctx.userId, OrgRole.ADMIN);

      if (input.id) {
        const existing = await db
          .selectFrom("Tournament")
          .selectAll()
          .where("id", "=", input.id)
          .where("organizationId", "=", input.organizationId)
          .executeTakeFirst();

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tournament not found",
          });
        }

        const updated = await db
          .updateTable("Tournament")
          .set({
            name: input.name,
            description: input.description ?? null,
            game: input.game,
            gameFormat: input.gameFormat,
            tournamentType: input.tournamentType,
            status: input.status,
            prizePool: input.prizePool ?? null,
            rules: input.rules ?? null,
            maxTeams: input.maxTeams,
            matchType: input.matchType,
            coverImage: input.coverImage ? input.coverImage : null,
            streamUrl: input.streamUrl ? input.streamUrl : null,
            startsAt: input.startsAt,
            endsAt: input.endsAt ?? null,
            isPublic: input.isPublic,
            updatedAt: new Date(),
          })
          .where("id", "=", input.id)
          .returningAll()
          .executeTakeFirstOrThrow();

        return updated;
      }

      const baseSlug = slugify(input.name);
      let slug = baseSlug;
      const collision = await db
        .selectFrom("Tournament")
        .select("id")
        .where("organizationId", "=", input.organizationId)
        .where("slug", "=", slug)
        .executeTakeFirst();

      if (collision) {
        slug = `${baseSlug}-${randomSlugSuffix()}`;
      }

      const created = await db
        .insertInto("Tournament")
        .values({
          organizationId: input.organizationId,
          eventId: input.eventId ?? null,
          authUserId: ctx.userId,
          name: input.name,
          slug,
          description: input.description ?? null,
          game: input.game,
          gameFormat: input.gameFormat,
          tournamentType: input.tournamentType,
          status: input.status,
          prizePool: input.prizePool ?? null,
          rules: input.rules ?? null,
          maxTeams: input.maxTeams,
          matchType: input.matchType,
          coverImage: input.coverImage ? input.coverImage : null,
          streamUrl: input.streamUrl ? input.streamUrl : null,
          startsAt: input.startsAt,
          endsAt: input.endsAt ?? null,
          isPublic: input.isPublic,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return created;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        tournamentId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireOrgRole(input.organizationId, ctx.userId, OrgRole.ADMIN);

      await db
        .deleteFrom("TournamentMatch")
        .where("tournamentId", "=", input.tournamentId)
        .execute();

      await db
        .deleteFrom("TournamentTeam")
        .where("tournamentId", "=", input.tournamentId)
        .execute();

      await db
        .deleteFrom("Tournament")
        .where("id", "=", input.tournamentId)
        .where("organizationId", "=", input.organizationId)
        .execute();

      return { success: true };
    }),

  registerTeam: procedure
    .input(teamRegisterSchema)
    .mutation(async ({ ctx, input }) => {
      const tournament = await db
        .selectFrom("Tournament")
        .selectAll()
        .where("id", "=", input.tournamentId)
        .executeTakeFirst();

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      if (
        tournament.status !== TournamentStatus.REGISTRATION &&
        tournament.status !== TournamentStatus.DRAFT
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament registration is currently closed",
        });
      }

      const teamCount = await db
        .selectFrom("TournamentTeam")
        .select(db.fn.count("id").as("count"))
        .where("tournamentId", "=", input.tournamentId)
        .executeTakeFirst();

      const currentCount = Number(teamCount?.count ?? 0);
      if (currentCount >= tournament.maxTeams) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament has reached max team capacity",
        });
      }

      const teamCheckInCode = randomCheckInCode();
      const authUserId = ctx.userId ?? null;

      const team = await db
        .insertInto("TournamentTeam")
        .values({
          tournamentId: input.tournamentId,
          authUserId,
          name: input.name,
          tag: input.tag ? input.tag.toUpperCase() : null,
          logo: input.logo ? input.logo : null,
          captainName: input.captainName,
          captainEmail: input.captainEmail,
          captainDiscord: input.captainDiscord ?? null,
          seed: currentCount + 1,
          players: input.players ? JSON.stringify(input.players) : null,
          status: "CONFIRMED",
          checkInCode: teamCheckInCode,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // If this tournament is linked to an Event, auto-register the team captain for the event pass
      if (tournament.eventId && authUserId) {
        try {
          const existingEventReg = await db
            .selectFrom("Registration")
            .select("id")
            .where("eventId", "=", tournament.eventId)
            .where("authUserId", "=", authUserId)
            .executeTakeFirst();

          if (!existingEventReg) {
            await db
              .insertInto("Registration")
              .values({
                eventId: tournament.eventId,
                organizationId: tournament.organizationId,
                authUserId,
                name: `${input.captainName} (${input.name})`,
                email: input.captainEmail,
                status: RegistrationStatus.CONFIRMED,
                checkInCode: teamCheckInCode,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .execute();
          }
        } catch {
          // Non-blocking if event registration fails
        }
      }

      return team;
    }),

  listMyRegistrations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    return await db
      .selectFrom("TournamentTeam")
      .innerJoin("Tournament", "Tournament.id", "TournamentTeam.tournamentId")
      .innerJoin("Organization", "Organization.id", "Tournament.organizationId")
      .select([
        "TournamentTeam.id as teamId",
        "TournamentTeam.name as teamName",
        "TournamentTeam.tag as teamTag",
        "TournamentTeam.captainName",
        "TournamentTeam.captainEmail",
        "TournamentTeam.captainDiscord",
        "TournamentTeam.seed",
        "TournamentTeam.status as teamStatus",
        "TournamentTeam.checkInCode",
        "TournamentTeam.createdAt as registeredAt",
        "Tournament.id as tournamentId",
        "Tournament.name as tournamentName",
        "Tournament.slug as tournamentSlug",
        "Tournament.game",
        "Tournament.gameFormat",
        "Tournament.tournamentType",
        "Tournament.matchType",
        "Tournament.status as tournamentStatus",
        "Tournament.prizePool",
        "Tournament.startsAt",
        "Organization.name as organizationName",
        "Organization.slug as organizationSlug",
      ])
      .where("TournamentTeam.authUserId", "=", userId)
      .orderBy("Tournament.startsAt", "desc")
      .execute();
  }),

  getMyRegistration: procedure
    .input(z.object({ tournamentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const authUserId = ctx.userId;
      if (!authUserId) return null;

      const team = await db
        .selectFrom("TournamentTeam")
        .selectAll()
        .where("tournamentId", "=", input.tournamentId)
        .where("authUserId", "=", authUserId)
        .orderBy("createdAt", "desc")
        .executeTakeFirst();

      return team ?? null;
    }),

  listByEvent: procedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return await db
        .selectFrom("Tournament")
        .selectAll()
        .where("eventId", "=", input.eventId)
        .orderBy("startsAt", "asc")
        .execute();
    }),

  updateTeamSeed: protectedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        teamId: z.number().int().positive(),
        seed: z.number().int().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireOrgRole(input.organizationId, ctx.userId, OrgRole.STAFF);

      await db
        .updateTable("TournamentTeam")
        .set({ seed: input.seed, updatedAt: new Date() })
        .where("id", "=", input.teamId)
        .execute();

      return { success: true };
    }),

  deleteTeam: protectedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        teamId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireOrgRole(input.organizationId, ctx.userId, OrgRole.STAFF);

      await db
        .deleteFrom("TournamentTeam")
        .where("id", "=", input.teamId)
        .execute();

      return { success: true };
    }),

  generateBracket: protectedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        tournamentId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireOrgRole(input.organizationId, ctx.userId, OrgRole.ADMIN);

      const tournament = await db
        .selectFrom("Tournament")
        .selectAll()
        .where("id", "=", input.tournamentId)
        .where("organizationId", "=", input.organizationId)
        .executeTakeFirst();

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      const teams = await db
        .selectFrom("TournamentTeam")
        .selectAll()
        .where("tournamentId", "=", tournament.id)
        .orderBy("seed", "asc")
        .orderBy("createdAt", "asc")
        .execute();

      if (teams.length < 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Need at least 2 teams to generate bracket",
        });
      }

      // Calculate bracket size (smallest power of 2 >= teams.length, min 4)
      let bracketSize = 4;
      while (bracketSize < teams.length && bracketSize < 128) {
        bracketSize *= 2;
      }

      const seedOrder = getSeedOrder(bracketSize);
      const totalRounds = Math.log2(bracketSize);

      // Clear existing matches
      await db
        .deleteFrom("TournamentMatch")
        .where("tournamentId", "=", tournament.id)
        .execute();

      // We will create matches round by round from Finals (round N) down to Round 1
      // so we can link nextMatchId properly.
      const matchMap = new Map<string, number>(); // key: `round-index` -> matchId

      for (let round = totalRounds; round >= 1; round--) {
        const matchesInRound = Math.pow(2, totalRounds - round);
        for (let m = 0; m < matchesInRound; m++) {
          const matchNumber = m + 1;
          const nextMatchRound = round + 1;
          const nextMatchIndex = Math.floor(m / 2);
          const nextMatchId =
            round === totalRounds
              ? null
              : matchMap.get(`${nextMatchRound}-${nextMatchIndex}`) ?? null;

          let team1Id: number | null = null;
          let team2Id: number | null = null;
          let status: MatchStatus = MatchStatus.PENDING;
          let winnerId: number | null = null;

          // For Round 1: place seeded teams
          if (round === 1) {
            const seed1 = seedOrder[2 * m] ?? 0;
            const seed2 = seedOrder[2 * m + 1] ?? 0;
            const t1 = seed1 > 0 ? teams[seed1 - 1] : undefined;
            const t2 = seed2 > 0 ? teams[seed2 - 1] : undefined;

            team1Id = t1 ? t1.id : null;
            team2Id = t2 ? t2.id : null;

            // Handle bye: if one team exists and other doesn't, auto-advance
            if (team1Id && !team2Id) {
              winnerId = team1Id;
              status = MatchStatus.COMPLETED;
            } else if (!team1Id && team2Id) {
              winnerId = team2Id;
              status = MatchStatus.COMPLETED;
            } else if (team1Id && team2Id) {
              status = MatchStatus.SCHEDULED;
            }
          }

          const inserted = await db
            .insertInto("TournamentMatch")
            .values({
              tournamentId: tournament.id,
              round,
              matchNumber,
              stage: round === totalRounds ? "FINALS" : "WINNERS",
              team1Id,
              team2Id,
              team1Score: 0,
              team2Score: 0,
              winnerId,
              nextMatchId,
              status,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returningAll()
            .executeTakeFirstOrThrow();

          matchMap.set(`${round}-${m}`, inserted.id);

          // If round 1 had a bye, advance winner to next match if already created
          if (round === 1 && winnerId && nextMatchId) {
            const isSlot1 = m % 2 === 0;
            await db
              .updateTable("TournamentMatch")
              .set(
                isSlot1
                  ? { team1Id: winnerId, updatedAt: new Date() }
                  : { team2Id: winnerId, updatedAt: new Date() },
              )
              .where("id", "=", nextMatchId)
              .execute();
          }
        }
      }

      await db
        .updateTable("Tournament")
        .set({
          status: TournamentStatus.IN_PROGRESS,
          updatedAt: new Date(),
        })
        .where("id", "=", tournament.id)
        .execute();

      return { success: true, bracketSize, totalRounds };
    }),

  updateMatch: protectedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        matchId: z.number().int().positive(),
        team1Score: z.number().int().min(0).default(0),
        team2Score: z.number().int().min(0).default(0),
        winnerId: z.number().int().positive().nullable().optional(),
        status: z.nativeEnum(MatchStatus).optional(),
        scheduledAt: z.coerce.date().nullable().optional(),
        vodUrl: z.string().max(1000).optional().or(z.literal("")).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireOrgRole(input.organizationId, ctx.userId, OrgRole.STAFF);

      const match = await db
        .selectFrom("TournamentMatch")
        .selectAll()
        .where("id", "=", input.matchId)
        .executeTakeFirst();

      if (!match) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Match not found",
        });
      }

      let winnerId = input.winnerId ?? match.winnerId;
      const status = input.status ?? match.status;

      // Auto-compute winner if scores entered and winner not manually selected
      if (!input.winnerId && (input.team1Score > 0 || input.team2Score > 0)) {
        if (input.team1Score > input.team2Score && match.team1Id) {
          winnerId = match.team1Id;
        } else if (input.team2Score > input.team1Score && match.team2Id) {
          winnerId = match.team2Id;
        }
      }

      const updated = await db
        .updateTable("TournamentMatch")
        .set({
          team1Score: input.team1Score,
          team2Score: input.team2Score,
          winnerId,
          status,
          scheduledAt: input.scheduledAt !== undefined ? input.scheduledAt : match.scheduledAt,
          vodUrl: input.vodUrl !== undefined ? input.vodUrl : match.vodUrl,
          updatedAt: new Date(),
        })
        .where("id", "=", match.id)
        .returningAll()
        .executeTakeFirstOrThrow();

      // If winner is decided and there's a next match, advance winner
      if (winnerId && match.nextMatchId) {
        // Even matchNumber feeds team1, odd matchNumber feeds team2
        const isTeam1 = (match.matchNumber - 1) % 2 === 0;
        await db
          .updateTable("TournamentMatch")
          .set(
            isTeam1
              ? { team1Id: winnerId, updatedAt: new Date() }
              : { team2Id: winnerId, updatedAt: new Date() },
          )
          .where("id", "=", match.nextMatchId)
          .execute();
      }

      // If this was the Grand Finals and it completed, complete the tournament!
      if (!match.nextMatchId && status === MatchStatus.COMPLETED) {
        await db
          .updateTable("Tournament")
          .set({
            status: TournamentStatus.COMPLETED,
            updatedAt: new Date(),
          })
          .where("id", "=", match.tournamentId)
          .execute();
      }

      return updated;
    }),

  resetBracket: protectedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        tournamentId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireOrgRole(input.organizationId, ctx.userId, OrgRole.ADMIN);

      await db
        .deleteFrom("TournamentMatch")
        .where("tournamentId", "=", input.tournamentId)
        .execute();

      await db
        .updateTable("Tournament")
        .set({
          status: TournamentStatus.REGISTRATION,
          updatedAt: new Date(),
        })
        .where("id", "=", input.tournamentId)
        .execute();

      return { success: true };
    }),
});
