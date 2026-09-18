// Read-only health check for the live database: confirms the submissions
// migration and the roadmap refresh both landed.
//
//   node --env-file=.env.local scripts/verify-production.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
console.log(`Checking ${url}\n`);

const columns = await client.execute("PRAGMA table_info(submissions)");
const hasColumn = columns.rows.some((r) => r.name === "updated_at");

const dupes = await client.execute(
  "select count(*) n from (select 1 from submissions group by assignment_id, student_id having count(*) > 1)"
);
const index = await client.execute(
  "select count(*) n from sqlite_master where type = 'index' and name = 'submissions_assignment_student_unique'"
);
const nodes = await client.execute("select count(*) n from roadmap_nodes");
const subs = await client.execute("select count(*) n from submissions");

const ok = (pass) => (pass ? "ok  " : "FAIL");
console.log(`${ok(hasColumn)} updated_at column`);
console.log(`${ok(Number(dupes.rows[0].n) === 0)} no duplicate submissions  (${dupes.rows[0].n} duplicate groups)`);
console.log(`${ok(Number(index.rows[0].n) === 1)} unique index in place`);
console.log(`${ok(Number(nodes.rows[0].n) === 53)} roadmap topics            (${nodes.rows[0].n}, expected 53)`);
console.log(`     submissions on record      ${subs.rows[0].n}`);
