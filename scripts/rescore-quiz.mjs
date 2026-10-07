// Re-grades existing quiz attempts against the quiz's CURRENT answer key.
//
// Needed when a quiz was created with the wrong correct answers: the stored
// attempts keep the student's choices, so once the key is corrected every
// attempt can be scored again without anyone re-sitting the quiz.
//
// Dry run (shows old → new, changes nothing):
//   node --env-file=.env.local scripts/rescore-quiz.mjs
//
// Apply:
//   node --env-file=.env.local scripts/rescore-quiz.mjs --yes
//
// Limit to one quiz by title:
//   node --env-file=.env.local scripts/rescore-quiz.mjs --quiz "week1"
import { createClient } from "@libsql/client";

const apply = process.argv.includes("--yes");
const titleArg = process.argv.indexOf("--quiz");
const onlyTitle = titleArg !== -1 ? process.argv[titleArg + 1] : null;

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
console.log(`${apply ? "Re-scoring" : "DRY RUN against"} ${url}\n`);

const quizzes = await client.execute("select id, title, questions, passing_score from quizzes");

for (const quiz of quizzes.rows) {
  if (onlyTitle && quiz.title !== onlyTitle) continue;

  let questions;
  try {
    questions = JSON.parse(quiz.questions);
  } catch {
    console.log(`! "${quiz.title}" has unreadable questions — skipped`);
    continue;
  }

  const key = questions.map((q) => q.correctIndex);
  const pass = Number(quiz.passing_score ?? 70);
  console.log(`QUIZ "${quiz.title}" — answer key ${JSON.stringify(key)}, pass ${pass}%`);

  if (key.every((k) => k === key[0])) {
    console.log("  ⚠ every question has the same correct option — check the key is actually right\n");
  }

  const attempts = await client.execute({
    sql: `select a.id, a.student_id, a.answers, a.score, a.total, a.passed, u.name
          from quiz_attempts a left join users u on u.id = a.student_id
          where a.quiz_id = ?`,
    args: [quiz.id],
  });

  for (const a of attempts.rows) {
    let answers = [];
    try {
      answers = JSON.parse(a.answers ?? "[]");
    } catch {
      answers = [];
    }
    const total = questions.length;
    const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
    const percent = total ? Math.round((score / total) * 100) : 0;
    const passed = percent >= pass;
    const changed = score !== Number(a.score) || total !== Number(a.total) || passed !== Boolean(a.passed);

    console.log(
      `  ${(a.name ?? "student").padEnd(16)} ${a.score}/${a.total} → ${score}/${total} (${percent}%)` +
        `${passed ? " PASS" : " fail"}${changed ? "" : "   [unchanged]"}`
    );

    if (apply && changed) {
      await client.execute({
        sql: "update quiz_attempts set score = ?, total = ?, passed = ? where id = ?",
        args: [score, total, passed ? 1 : 0, a.id],
      });
    }
  }
  console.log("");
}

console.log(apply ? "Done." : "Nothing was changed. Re-run with --yes to apply.");
