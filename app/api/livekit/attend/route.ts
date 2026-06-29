import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sessionWindow } from "@/lib/format";

export const dynamic = "force-dynamic";

// A student marks themselves present (triggered by the host's attendance pop-up).
export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const sessionId = String(body.session || "");

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: { course: { include: { enrollments: { where: { studentId: user.id } } } } },
  });
  if (!session) return Response.json({ error: "not found" }, { status: 404 });
  if (session.course.enrollments.length === 0) {
    return Response.json({ error: "not enrolled" }, { status: 403 });
  }

  const win = sessionWindow(session.startsAt, session.endsAt);
  if (win === "closed") return Response.json({ error: "closed" }, { status: 409 });

  const status = new Date() > session.startsAt ? "LATE" : "PRESENT";
  await prisma.attendance.upsert({
    where: { sessionId_studentId: { sessionId, studentId: user.id } },
    update: {},
    create: { sessionId, studentId: user.id, status },
  });

  return Response.json({ ok: true, status });
}
