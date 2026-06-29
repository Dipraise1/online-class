import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Fetch a quiz to answer (students never receive isCorrect).
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      course: { include: { enrollments: { where: { studentId: user.id } } } },
      questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } },
    },
  });
  if (!quiz) return Response.json({ error: "not found" }, { status: 404 });

  const isOwner = user.role === "LECTURER" && quiz.course.lecturerId === user.id;
  const isEnrolled = quiz.course.enrollments.length > 0;
  if (!isOwner && !isEnrolled) return Response.json({ error: "forbidden" }, { status: 403 });

  return Response.json({
    id: quiz.id,
    title: quiz.title,
    kind: quiz.kind,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    })),
  });
}
