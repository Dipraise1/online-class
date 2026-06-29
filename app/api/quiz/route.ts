import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Lecturer pre-prepares a poll/quiz.
export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "LECTURER") return Response.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const courseId = String(body.courseId || "");
  const title = String(body.title || "").trim();
  const kind = body.kind === "QUIZ" ? "QUIZ" : "POLL";
  const questions = Array.isArray(body.questions) ? body.questions : [];

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.lecturerId !== user.id) return Response.json({ error: "forbidden" }, { status: 403 });

  const clean = questions
    .map((q: { text?: string; options?: { text?: string; isCorrect?: boolean }[] }) => ({
      text: String(q.text || "").trim(),
      options: (Array.isArray(q.options) ? q.options : [])
        .map((o) => ({ text: String(o.text || "").trim(), isCorrect: !!o.isCorrect }))
        .filter((o) => o.text),
    }))
    .filter((q: { text: string; options: unknown[] }) => q.text && q.options.length >= 2);

  if (!title || clean.length === 0) return Response.json({ error: "title and at least one question with 2+ options required" }, { status: 400 });

  const quiz = await prisma.quiz.create({
    data: {
      courseId,
      lecturerId: user.id,
      title,
      kind,
      questions: {
        create: clean.map((q: { text: string; options: { text: string; isCorrect: boolean }[] }, qi: number) => ({
          text: q.text,
          order: qi,
          options: { create: q.options.map((o, oi) => ({ text: o.text, isCorrect: o.isCorrect, order: oi })) },
        })),
      },
    },
  });
  return Response.json({ ok: true, id: quiz.id });
}
