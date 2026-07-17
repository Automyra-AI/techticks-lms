import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { assignments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

// Serves an assignment's uploaded file (stored as base64) with the right
// content type, so students can open/download it in the browser.
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
  if (!assignment?.attachmentData) {
    return NextResponse.json({ error: "No file" }, { status: 404 });
  }

  const buffer = Buffer.from(assignment.attachmentData, "base64");
  const name = assignment.attachmentName ?? "assignment-file";
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": assignment.attachmentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${name.replace(/"/g, "")}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
