// Adds the batches feature to a database and places existing students into a
// starting batch, so nothing becomes invisible the moment the code ships.
//
// Everything here is additive: new table, new nullable columns, and one UPDATE
// that assigns students who have no batch yet. No rows are deleted.
//
// Dry run:  node --env-file=.env.local scripts/migrate-batches.mjs
// Apply:    node --env-file=.env.local scripts/migrate-batches.mjs --yes
//
// The batch name can be overridden:
//   node --env-file=.env.local scripts/migrate-batches.mjs --yes --name "AI Automation Batch 7"
import { createClient } from "@libsql/client";
import { randomUUID } from "node:crypto";

const apply = process.argv.includes("--yes");
const nameIdx = process.argv.indexOf("--name");
const BATCH_NAME = nameIdx !== -1 ? process.argv[nameIdx + 1] : "AI Automation Batch 6";

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
console.log(`${apply ? "Migrating" : "DRY RUN against"} ${url}\n`);

const columns = async (table) =>
  (await client.execute(`PRAGMA table_info(${table})`)).rows.map((r) => r.name);

const plan = [];

// 1. the batches table
const tables = (await client.execute("select name from sqlite_master where type='table'")).rows.map(
  (r) => r.name
);
if (!tables.includes("batches")) plan.push("create table batches");

// 2. batch_id columns
for (const table of ["users", "assignments", "sessions", "quizzes", "announcements"]) {
  if (!(await columns(table)).includes("batch_id")) plan.push(`add ${table}.batch_id`);
}

// 3. students with no batch
const students = (
  await client.execute("select id from users where role = 'student'")
).rows;
const unassigned = tables.includes("batches")
  ? (await client.execute("select id from users where role = 'student' and batch_id is null")).rows
  : students;

console.log("Planned changes:");
for (const p of plan) console.log(`  - ${p}`);
console.log(`  - put ${unassigned.length} student(s) into "${BATCH_NAME}"`);
if (plan.length === 0 && unassigned.length === 0) console.log("  (nothing to do)");

if (!apply) {
  console.log("\nNothing was changed. Re-run with --yes to apply.");
  process.exit(0);
}

console.log("");

await client.execute(`CREATE TABLE IF NOT EXISTS batches (
  id text PRIMARY KEY,
  course_id text NOT NULL,
  name text NOT NULL,
  start_date text,
  end_date text,
  status text DEFAULT 'active',
  created_at text NOT NULL
)`);
console.log("+ batches table");

for (const table of ["users", "assignments", "sessions", "quizzes", "announcements"]) {
  if (!(await columns(table)).includes("batch_id")) {
    await client.execute(`ALTER TABLE ${table} ADD COLUMN batch_id text`);
    console.log(`+ ${table}.batch_id`);
  }
}

// Reuse a batch of this name if the script is run twice.
const existing = (
  await client.execute({ sql: "select id from batches where name = ?", args: [BATCH_NAME] })
).rows;

let batchId = existing[0]?.id;
if (!batchId) {
  const [course] = (await client.execute("select id from courses limit 1")).rows;
  if (!course) {
    console.log("! No course found — create a course first.");
    process.exit(1);
  }
  batchId = randomUUID();
  await client.execute({
    sql: "insert into batches (id, course_id, name, status, created_at) values (?, ?, ?, 'active', ?)",
    args: [batchId, course.id, BATCH_NAME, new Date().toISOString()],
  });
  console.log(`+ batch "${BATCH_NAME}"`);
}

const res = await client.execute({
  sql: "update users set batch_id = ? where role = 'student' and batch_id is null",
  args: [batchId],
});
console.log(`+ assigned ${res.rowsAffected} student(s) to "${BATCH_NAME}"`);

const check = await client.execute(
  "select count(*) n from users where role = 'student' and batch_id is null"
);
console.log(`\nStudents still without a batch: ${check.rows[0].n}`);
console.log("Existing assignments, sessions and quizzes stay unscoped, so every batch still sees them.");
