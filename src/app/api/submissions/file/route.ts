import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

// Serves a student's uploaded submission file. Accessible to staff (for grading)
// and to the student who owns the submission.
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
  if (!submission?.fileData) return NextResponse.json({ error: "No file" }, { status: 404 });

  const isStaff = session.role === "admin" || session.role === "trainer";
  if (!isStaff && submission.studentId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = Buffer.from(submission.fileData, "base64");
  const name = submission.fileName ?? "submission-file";
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": submission.fileType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${name.replace(/"/g, "")}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
