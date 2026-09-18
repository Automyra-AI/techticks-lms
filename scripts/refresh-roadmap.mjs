// Re-applies DEFAULT_ROADMAP (the 11-week AI Automation Bootcamp outline) to
// every course that already has a roadmap. Nodes are matched by order_index and
// updated in place, so node ids — and the lesson progress and assignments that
// point at them — survive. Surplus nodes from the old, shorter roadmap are
// removed along with their progress rows, and any assignment attached to one is
// detached rather than deleted.
//
//   npx tsx --env-file=.env.local scripts/refresh-roadmap.mjs
import { createClient } from "@libsql/client";
import { randomUUID } from "node:crypto";
import { DEFAULT_ROADMAP } from "../src/lib/db/default-roadmap.ts";

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
console.log(`Refreshing roadmaps in ${url} — ${DEFAULT_ROADMAP.length} topics`);

const courses = await client.execute("SELECT id, title FROM courses");

for (const course of courses.rows) {
  const existing = await client.execute({
    sql: "SELECT id, order_index FROM roadmap_nodes WHERE course_id = ? ORDER BY order_index",
    args: [course.id],
  });
  const byIndex = new Map(existing.rows.map((r) => [Number(r.order_index), r.id]));

  for (const [i, topic] of DEFAULT_ROADMAP.entries()) {
    const description = `${topic.week} · Outcome: ${topic.outcome}`;
    const id = byIndex.get(i);
    if (id) {
      await client.execute({
        sql: `UPDATE roadmap_nodes
                 SET title = ?, description = ?, difficulty = ?, duration = ?,
                     position_x = 400, position_y = ?
               WHERE id = ?`,
        args: [topic.title, description, topic.difficulty, topic.duration, i * 170, id],
      });
    } else {
      await client.execute({
        sql: `INSERT INTO roadmap_nodes
                (id, course_id, title, description, difficulty, duration, status,
                 order_index, position_x, position_y)
              VALUES (?, ?, ?, ?, ?, ?, 'not_started', ?, 400, ?)`,
        args: [randomUUID(), course.id, topic.title, description, topic.difficulty, topic.duration, i, i * 170],
      });
    }
  }

  // Drop any leftovers from the previous, longer/shorter roadmap.
  const surplus = existing.rows.filter((r) => Number(r.order_index) >= DEFAULT_ROADMAP.length);
  for (const row of surplus) {
    await client.execute({ sql: "DELETE FROM lesson_progress WHERE node_id = ?", args: [row.id] });
    await client.execute({ sql: "UPDATE assignments SET node_id = NULL WHERE node_id = ?", args: [row.id] });
    await client.execute({ sql: "DELETE FROM roadmap_nodes WHERE id = ?", args: [row.id] });
  }

  console.log(
    `${course.title}: ${existing.rows.length} → ${DEFAULT_ROADMAP.length} topics ` +
      `(${surplus.length} removed)`
  );
}
