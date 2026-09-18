// One-off migration: give `submissions` an `updated_at` column and enforce one
// row per (assignment, student). Any pre-existing duplicates are collapsed to
// the most recent row first, otherwise the unique index cannot be created.
// Run against the local file DB or Turso:
//   node --env-file=.env.local scripts/migrate-submissions-unique.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
console.log(`Migrating ${url}`);

const columns = await client.execute("PRAGMA table_info(submissions)");
if (!columns.rows.some((c) => c.name === "updated_at")) {
  await client.execute("ALTER TABLE submissions ADD COLUMN updated_at text");
  console.log("+ added submissions.updated_at");
} else {
  console.log("= submissions.updated_at already present");
}

// Keep the newest row per (assignment, student); drop the older duplicates.
const dupes = await client.execute(`
  SELECT id FROM submissions
  WHERE id NOT IN (
    SELECT id FROM submissions s
    WHERE rowid = (
      SELECT rowid FROM submissions t
      WHERE t.assignment_id = s.assignment_id AND t.student_id = s.student_id
      ORDER BY coalesce(t.updated_at, t.submitted_at) DESC, t.rowid DESC
      LIMIT 1
    )
  )
`);
for (const row of dupes.rows) {
  await client.execute({ sql: "DELETE FROM submissions WHERE id = ?", args: [row.id] });
}
console.log(`- removed ${dupes.rows.length} duplicate submission row(s)`);

await client.execute(
  "CREATE UNIQUE INDEX IF NOT EXISTS submissions_assignment_student_unique ON submissions (assignment_id, student_id)"
);
console.log("+ unique index submissions_assignment_student_unique");
