import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// A student submits their answers to a live quiz/poll.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      course: { include: { enrollments: { where: { studentId: user.id } } } },
      questions: { include: { options: true } },
    },
  });
  if (!quiz) return Response.json({ error: "not found" }, { status: 404 });
  if (quiz.course.enrollments.length === 0) return Response.json({ error: "not enrolled" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const answers = Array.isArray(body.answers) ? body.answers : [];
  const validOption = new Map<string, string>(); // optionId -> questionId
  quiz.questions.forEach((q) => q.options.forEach((o) => validOption.set(o.id, q.id)));

  let saved = 0;
  for (const a of answers) {
    const optionId = String(a.optionId || "");
    const questionId = String(a.questionId || "");
    if (validOption.get(optionId) !== questionId) continue;
    await prisma.quizResponse.upsert({
      where: { questionId_studentId: { questionId, studentId: user.id } },
      update: { optionId },
      create: { questionId, optionId, studentId: user.id },
    });
    saved += 1;
  }
  return Response.json({ ok: true, saved });
}
