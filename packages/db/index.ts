import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import type { DB } from "./prisma/types";

export { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

export * from "./prisma/types";
export * from "./prisma/enums";

export function createDb<TDatabase>(): Kysely<TDatabase> {
  const connectionString =
    process.env.POSTGRES_URL ||
    "postgresql://default:default@localhost:5432/verceldb";

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

let _db: Kysely<DB> | null = null;

export const db: Kysely<DB> = new Proxy({} as Kysely<DB>, {
  get(_target, prop, receiver) {
    if (!_db) {
      _db = createDb<DB>();
    }
    return Reflect.get(_db, prop, receiver);
  },
});
