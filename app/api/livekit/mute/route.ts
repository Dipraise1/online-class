import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roomNameFor, roomService, muteParticipantMic } from "@/lib/livekit";

export const dynamic = "force-dynamic";

// Host-only: force-mute one participant, or everyone except the host.
export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const sessionId = String(body.session || "");
  const target = body.identity ? String(body.identity) : null;
  const all = Boolean(body.all);

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: { course: true },
  });
  if (!session) return Response.json({ error: "not found" }, { status: 404 });
  if (!(user.role === "LECTURER" && session.course.lecturerId === user.id)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const room = roomNameFor(sessionId);
  try {
    if (all) {
      const svc = roomService();
      const parts = await svc.listParticipants(room);
      await Promise.all(
        parts
          .filter((p) => p.identity !== user.id)
          .map((p) => muteParticipantMic(room, p.identity).catch(() => {}))
      );
    } else if (target) {
      await muteParticipantMic(room, target);
    }
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
