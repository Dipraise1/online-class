import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Lecturer: prepared quizzes/polls for the course of a given session.
export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const sessionId = new URL(req.url).searchParams.get("session");
  if (!sessionId) return Response.json({ error: "missing session" }, { status: 400 });

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: { course: true },
  });
  if (!session) return Response.json({ error: "not found" }, { status: 404 });
  if (!(user.role === "LECTURER" && session.course.lecturerId === user.id)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const quizzes = await prisma.quiz.findMany({
    where: { courseId: session.courseId },
    include: { _count: { select: { questions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    quizzes: quizzes.map((q) => ({ id: q.id, title: q.title, kind: q.kind, questions: q._count.questions })),
  });
}
