import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

if (url.startsWith("libsql://") && !authToken) {
  throw new Error(
    "TURSO_AUTH_TOKEN is required when using a remote Turso database. Add it to .env.local or Vercel env vars."
  );
}

const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });
