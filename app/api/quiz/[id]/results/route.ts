import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Lecturer-only: live aggregated results for a quiz/poll.
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      course: true,
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" }, include: { _count: { select: { responses: true } } } } },
      },
    },
  });
  if (!quiz) return Response.json({ error: "not found" }, { status: 404 });
  if (!(user.role === "LECTURER" && quiz.course.lecturerId === user.id)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  // distinct responders
  const responders = await prisma.quizResponse.findMany({
    where: { question: { quizId: id } },
    select: { studentId: true },
    distinct: ["studentId"],
  });

  // for QUIZ: per-student correct count
  let scores: { correct: number; total: number; students: number } | null = null;
  if (quiz.kind === "QUIZ") {
    const correctOptionIds = new Set(
      quiz.questions.flatMap((q) => q.options.filter((o) => o.isCorrect).map((o) => o.id))
    );
    const all = await prisma.quizResponse.findMany({
      where: { question: { quizId: id } },
      select: { studentId: true, optionId: true },
    });
    const byStudent = new Map<string, number>();
    all.forEach((r) => {
      if (correctOptionIds.has(r.optionId)) byStudent.set(r.studentId, (byStudent.get(r.studentId) || 0) + 1);
      else if (!byStudent.has(r.studentId)) byStudent.set(r.studentId, 0);
    });
    const totalCorrect = [...byStudent.values()].reduce((a, b) => a + b, 0);
    scores = { correct: totalCorrect, total: quiz.questions.length, students: byStudent.size };
  }

  return Response.json({
    id: quiz.id,
    title: quiz.title,
    kind: quiz.kind,
    responders: responders.length,
    scores,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect, count: o._count.responses })),
    })),
  });
}
