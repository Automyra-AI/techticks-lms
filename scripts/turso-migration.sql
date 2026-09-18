-- Turso production migration
-- Paste into the Turso dashboard SQL shell (or `turso db shell <db>`).
-- Run the sections in order. Step 1 alone stops the 500 errors.

-- ─────────────────────────────────────────────────────────────
-- STEP 1 — REQUIRED. Adds the column the deployed code selects.
-- Without it every submissions query fails with
-- "no such column: updated_at" and the dashboard returns a 500.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE submissions ADD COLUMN updated_at text;


-- ─────────────────────────────────────────────────────────────
-- STEP 2 — Optional but recommended. Collapses the duplicate
-- submissions created before the fix, keeping only the most
-- recent row per (assignment, student).
--
-- ⚠ THIS DELETES ROWS. Take a backup first.
-- Run the SELECT on its own to preview what would go:
--
--   SELECT id, assignment_id, student_id, submitted_at
--   FROM submissions WHERE id NOT IN ( … the subquery below … );
-- ─────────────────────────────────────────────────────────────
DELETE FROM submissions
WHERE id NOT IN (
  SELECT id FROM submissions s
  WHERE rowid = (
    SELECT rowid FROM submissions t
    WHERE t.assignment_id = s.assignment_id
      AND t.student_id = s.student_id
    ORDER BY coalesce(t.updated_at, t.submitted_at) DESC, t.rowid DESC
    LIMIT 1
  )
);


-- ─────────────────────────────────────────────────────────────
-- STEP 3 — Optional. Stops duplicates at the database level
-- (a double-clicked submit can otherwise still race through).
-- Fails if step 2 was skipped and duplicates remain.
-- ─────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS submissions_assignment_student_unique
  ON submissions (assignment_id, student_id);


-- ─────────────────────────────────────────────────────────────
-- VERIFY — expect a row named updated_at, and 0 duplicate groups.
-- ─────────────────────────────────────────────────────────────
-- PRAGMA table_info(submissions);
-- SELECT count(*) AS duplicate_groups FROM (
--   SELECT 1 FROM submissions GROUP BY assignment_id, student_id HAVING count(*) > 1
-- );
