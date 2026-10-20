// Moves everything attached to the demo admin onto a real admin account, then
// removes the demo account.
//
// Nothing is deleted except the demo user row itself. Every row that pointed at
// it is re-pointed first, and the script refuses to delete if any reference is
// left behind. Table counts are compared before and after, so a silent loss
// anywhere would show up as a failed check.
//
// Dry run:  node --env-file=.env.local scripts/move-admin-account.mjs
// Apply:    node --env-file=.env.local scripts/move-admin-account.mjs --yes
import { createClient } from "@libsql/client";

const apply = process.argv.includes("--yes");
const FROM_EMAIL = "admin@techticks.com";
const TO_EMAIL = "amnahafeez758@gmail.com";

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const run = async (fn) => {
  for (let i = 0; i < 5; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === 4) throw e;
      await new Promise((r) => setTimeout(r, 2500));
    }
  }
};

console.log(`${apply ? "Applying to" : "DRY RUN against"} ${url}\n`);

// Every column in the schema that points at users.id.
const REFS = [
  ["courses", "trainer_id"],
  ["enrollments", "user_id"],
  ["submissions", "student_id"],
  ["attendance", "student_id"],
  ["announcements", "author_id"],
  ["messages", "sender_id"],
  ["messages", "receiver_id"],
  ["notifications", "user_id"],
  ["weekly_remarks", "student_id"],
  ["weekly_remarks", "trainer_id"],
  ["quiz_attempts", "student_id"],
  ["certificates", "user_id"],
  ["lesson_progress", "user_id"],
  ["presentation_members", "student_id"],
];

const COUNTED = [
  "users", "courses", "batches", "enrollments", "assignments", "submissions",
  "attendance", "sessions", "announcements", "resources", "quizzes",
  "quiz_attempts", "certificates", "lesson_progress", "roadmap_nodes",
  "weekly_remarks", "notifications", "presentations", "presentation_groups",
  "presentation_members",
];

async function snapshot() {
  const out = {};
  for (const t of COUNTED) {
    try {
      const r = await run(() => client.execute(`select count(*) n from ${t}`));
      out[t] = Number(r.rows[0].n);
    } catch {
      out[t] = null; // table may not exist on an older database
    }
  }
  return out;
}

const [from] = (
  await run(() => client.execute({ sql: "select * from users where email = ?", args: [FROM_EMAIL] }))
).rows;
const [to] = (
  await run(() => client.execute({ sql: "select * from users where email = ?", args: [TO_EMAIL] }))
).rows;

if (!from) {
  console.log(`"${FROM_EMAIL}" does not exist — nothing to do.`);
  process.exit(0);
}
if (!to) {
  console.log(`! "${TO_EMAIL}" was not found. Create that admin account first — refusing to delete anything.`);
  process.exit(1);
}

console.log(`from: ${FROM_EMAIL}  ${from.id}  (${from.role})`);
console.log(`to:   ${TO_EMAIL}  ${to.id}  (${to.role})\n`);

console.log("Rows that will be re-pointed:");
let total = 0;
const work = [];
for (const [table, col] of REFS) {
  const r = await run(() =>
    client.execute({ sql: `select count(*) n from ${table} where ${col} = ?`, args: [from.id] })
  );
  const n = Number(r.rows[0].n);
  if (n > 0) {
    work.push([table, col, n]);
    total += n;
    console.log(`  ${`${table}.${col}`.padEnd(32)} ${n}`);
  }
}
if (total === 0) console.log("  (none — the account owns no data)");

if (!apply) {
  console.log(`\nThen "${FROM_EMAIL}" would be deleted.`);
  console.log("Nothing was changed. Re-run with --yes to apply.");
  process.exit(0);
}

const before = await snapshot();
console.log("");

for (const [table, col, n] of work) {
  await run(() =>
    client.execute({
      sql: `update ${table} set ${col} = ? where ${col} = ?`,
      args: [to.id, from.id],
    })
  );
  console.log(`+ moved ${n} row(s) in ${table}.${col}`);
}

// Refuse to delete while anything still points at the old account.
let leftover = 0;
for (const [table, col] of REFS) {
  const r = await run(() =>
    client.execute({ sql: `select count(*) n from ${table} where ${col} = ?`, args: [from.id] })
  );
  leftover += Number(r.rows[0].n);
}
if (leftover > 0) {
  console.log(`\n! ${leftover} reference(s) still point at the old account — NOT deleting it.`);
  process.exit(1);
}

await run(() => client.execute({ sql: "delete from users where id = ?", args: [from.id] }));
console.log(`- deleted ${FROM_EMAIL}`);

const after = await snapshot();

console.log("\nRow counts before → after:");
let problems = 0;
for (const t of COUNTED) {
  if (before[t] === null) continue;
  const expected = t === "users" ? before[t] - 1 : before[t];
  const ok = after[t] === expected;
  if (!ok) problems++;
  console.log(`  ${t.padEnd(22)} ${before[t]} → ${after[t]}  ${ok ? "ok" : "CHANGED UNEXPECTEDLY"}`);
}

console.log(
  problems === 0
    ? "\nNothing was lost: every table is unchanged except users, which is down by the one deleted account."
    : `\n! ${problems} table(s) changed unexpectedly — check the list above.`
);
