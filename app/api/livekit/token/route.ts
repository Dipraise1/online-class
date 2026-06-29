import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAccessToken, roomNameFor, LIVEKIT_WS_URL } from "@/lib/livekit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const sessionId = new URL(req.url).searchParams.get("session");
  if (!sessionId) return Response.json({ error: "missing session" }, { status: 400 });

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: { course: { include: { enrollments: { where: { studentId: user.id } } } } },
  });
  if (!session) return Response.json({ error: "not found" }, { status: 404 });

  const isOwner = user.role === "LECTURER" && session.course.lecturerId === user.id;
  const isEnrolled = session.course.enrollments.length > 0;
  if (!isOwner && !isEnrolled) return Response.json({ error: "forbidden" }, { status: 403 });

  const role = isOwner ? "host" : "student";
  const token = await createAccessToken({
    identity: user.id,
    name: user.name,
    room: roomNameFor(session.id),
    role,
  });

  return Response.json({ token, url: LIVEKIT_WS_URL, role, identity: user.id });
}
