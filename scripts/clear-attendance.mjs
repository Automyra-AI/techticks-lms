// Clears attendance records — intended for wiping test data before a real
// cohort starts, so the attendance percentage isn't reporting a trial run.
//
// Dry run first (prints what it would delete, changes nothing):
//   node --env-file=.env.local scripts/clear-attendance.mjs
//
// Then, to actually delete:
//   node --env-file=.env.local scripts/clear-attendance.mjs --yes
//
// Add --with-sessions to also remove the sessions themselves, not just the
// attendance marks against them.
import { createClient } from "@libsql/client";

const apply = process.argv.includes("--yes");
const withSessions = process.argv.includes("--with-sessions");

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
console.log(`${apply ? "Clearing" : "DRY RUN against"} ${url}\n`);

const rows = await client.execute(`
  select a.id, a.status, a.marked_at, u.name, s.title as session_title
  from attendance a
  left join users u on u.id = a.student_id
  left join sessions s on s.id = a.session_id
  order by a.marked_at
`);

if (rows.rows.length === 0) {
  console.log("No attendance records — nothing to clear.");
} else {
  console.log(`${rows.rows.length} attendance record(s):`);
  for (const r of rows.rows) {
    console.log(`  ${r.name ?? "(unknown)"} — ${r.status} — "${r.session_title ?? "?"}" — ${r.marked_at}`);
  }
}

const sessions = await client.execute("select id, title, scheduled_at from sessions");
if (withSessions && sessions.rows.length) {
  console.log(`\n${sessions.rows.length} session(s) would also be removed:`);
  for (const s of sessions.rows) console.log(`  "${s.title}" — ${s.scheduled_at}`);
}

if (!apply) {
  console.log("\nNothing was changed. Re-run with --yes to apply.");
} else {
  await client.execute("delete from attendance");
  console.log(`\n- deleted ${rows.rows.length} attendance record(s)`);
  if (withSessions) {
    await client.execute("delete from sessions");
    console.log(`- deleted ${sessions.rows.length} session(s)`);
  }
  const left = await client.execute("select count(*) n from attendance");
  console.log(`\nAttendance records remaining: ${left.rows[0].n} — the page will now read 0%.`);
}
