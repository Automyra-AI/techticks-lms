// Repairs a quiz's answer key in place.
//
// The key is given below as the correct ANSWER TEXT, not an option letter,
// because the stored option order differs from the order the questions were
// written in — matching on letters would just produce a second wrong key.
// Question text and options are left untouched, so attempts already submitted
// stay comparable and can be re-scored (scripts/rescore-quiz.mjs).
//
// Dry run:   node --env-file=.env.local scripts/set-quiz-key.mjs
// Apply:     node --env-file=.env.local scripts/set-quiz-key.mjs --yes
import { createClient } from "@libsql/client";

const apply = process.argv.includes("--yes");

const QUIZ_TITLE = "week1";

// question text (matched loosely) → the option text that is correct
const ANSWERS = [
  ["starts an automation workflow", "Trigger"],
  ["method is used to fetch data", "GET"],
  ["does API stand for", "Application Programming Interface"],
  ["status code means", "201"],
  ["status-code group represents server errors", "5xx"],
  ["where do you send JSON data", "body"],
  ["query params mainly do", "filter"],
  ["webhook usually sends data using", "post"],
  ["identifies a specific API resource", "endpoint"],
  ["Bearer Token normally sent", "Authorization header"],
];

const norm = (s) => s.trim().toLowerCase().replace(/\s+/g, " ");

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
console.log(`${apply ? "Updating" : "DRY RUN against"} ${url}\n`);

const quizzes = await client.execute({
  sql: "select id, title, questions from quizzes where title = ?",
  args: [QUIZ_TITLE],
});

if (quizzes.rows.length === 0) {
  console.log(`No quiz titled "${QUIZ_TITLE}".`);
  process.exit(1);
}

for (const quiz of quizzes.rows) {
  const questions = JSON.parse(quiz.questions);
  const before = questions.map((q) => q.correctIndex);
  let unresolved = 0;

  for (const q of questions) {
    const rule = ANSWERS.find(([needle]) => norm(q.question).includes(norm(needle)));
    if (!rule) {
      console.log(`? no rule for: "${q.question}" — left as is`);
      unresolved++;
      continue;
    }
    const idx = q.options.findIndex((o) => norm(o) === norm(rule[1]));
    if (idx === -1) {
      console.log(`? "${rule[1]}" is not an option of: "${q.question}" — left as is`);
      unresolved++;
      continue;
    }
    q.correctIndex = idx;
  }

  const after = questions.map((q) => q.correctIndex);
  console.log(`QUIZ "${quiz.title}"`);
  questions.forEach((q, i) => {
    const mark = before[i] === after[i] ? "  " : "->";
    console.log(`${mark} ${i + 1}. ${q.question}`);
    console.log(`      was: ${q.options[before[i]] ?? "(none)"}   now: ${q.options[after[i]]}`);
  });
  console.log(`\n  key ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
  if (unresolved) console.log(`  ${unresolved} question(s) could not be matched — check them by hand.`);

  if (apply) {
    await client.execute({
      sql: "update quizzes set questions = ? where id = ?",
      args: [JSON.stringify(questions), quiz.id],
    });
    console.log("\n  saved.");
  } else {
    console.log("\n  Nothing was changed. Re-run with --yes to apply.");
  }
}
