import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Lecturer-only: CSV of who attended a session (matric, name, status, time).
export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const sessionId = new URL(req.url).searchParams.get("session");
  if (!sessionId) return Response.json({ error: "missing session" }, { status: 400 });

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      course: true,
      attendances: { include: { student: true }, orderBy: { markedAt: "asc" } },
    },
  });
  if (!session) return Response.json({ error: "not found" }, { status: 404 });
  if (!(user.role === "LECTURER" && session.course.lecturerId === user.id)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const esc = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
  const rows = [
    ["Matric", "Name", "Status", "Marked At"].join(","),
    ...session.attendances.map((a) =>
      [esc(a.student.matric || ""), esc(a.student.name), a.status, a.markedAt.toISOString()].join(",")
    ),
  ].join("\n");

  const fname = `attendance-${session.course.code.replace(/\s+/g, "")}-${session.id}.csv`;
  return new Response(rows, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${fname}"`,
    },
  });
}
