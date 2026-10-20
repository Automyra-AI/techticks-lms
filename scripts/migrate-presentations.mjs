// Adds the presentations feature and the onsite-session fields.
//
// Purely additive: three new tables and one nullable column. No existing row
// is read, changed or deleted.
//
// Dry run:  node --env-file=.env.local scripts/migrate-presentations.mjs
// Apply:    node --env-file=.env.local scripts/migrate-presentations.mjs --yes
import { createClient } from "@libsql/client";

const apply = process.argv.includes("--yes");
const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
console.log(`${apply ? "Migrating" : "DRY RUN against"} ${url}\n`);

const tables = (await client.execute("select name from sqlite_master where type='table'")).rows.map(
  (r) => r.name
);
const sessionCols = (await client.execute("PRAGMA table_info(sessions)")).rows.map((r) => r.name);

const plan = [];
for (const t of ["presentations", "presentation_groups", "presentation_members"]) {
  if (!tables.includes(t)) plan.push(`create table ${t}`);
}
if (!sessionCols.includes("location")) plan.push("add sessions.location");

console.log("Planned changes:");
if (plan.length === 0) console.log("  (nothing to do)");
for (const p of plan) console.log(`  - ${p}`);

if (!apply) {
  console.log("\nNothing was changed. Re-run with --yes to apply.");
  process.exit(0);
}
console.log("");

await client.execute(`CREATE TABLE IF NOT EXISTS presentations (
  id text PRIMARY KEY,
  course_id text NOT NULL,
  batch_id text,
  title text NOT NULL,
  description text,
  mode text NOT NULL DEFAULT 'group',
  scheduled_at text,
  created_at text NOT NULL
)`);
console.log("+ presentations");

await client.execute(`CREATE TABLE IF NOT EXISTS presentation_groups (
  id text PRIMARY KEY,
  presentation_id text NOT NULL,
  name text NOT NULL,
  topic text,
  notes text,
  order_index integer NOT NULL DEFAULT 0
)`);
console.log("+ presentation_groups");

await client.execute(`CREATE TABLE IF NOT EXISTS presentation_members (
  id text PRIMARY KEY,
  group_id text NOT NULL,
  student_id text NOT NULL
)`);
console.log("+ presentation_members");

if (!sessionCols.includes("location")) {
  await client.execute("ALTER TABLE sessions ADD COLUMN location text");
  console.log("+ sessions.location");
}

console.log("\nDone. Existing sessions keep their platform; 'onsite' is simply a new option.");
