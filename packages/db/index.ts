import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import type { DB } from "./prisma/types";

export { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

export * from "./prisma/types";
export * from "./prisma/enums";

export function createDb<TDatabase>(): Kysely<TDatabase> {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error(
      "POSTGRES_URL is not set. Add it to .env.local before using @saasfly/db.",
    );
  }

  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");

  return new Kysely<TDatabase>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString,
        // Local Docker/CI Postgres has no TLS. Remote providers commonly hand
        // out self-signed certs that the system trust store rejects.
        ssl: isLocal ? false : { rejectUnauthorized: false },
        max: 10,
      }),
    }),
  });
}

export const db = createDb<DB>();
