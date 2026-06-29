import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Nav from "@/components/Nav";
import QuizBuilder from "@/components/QuizBuilder";

export default async function NewQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();
  if (!(user.role === "LECTURER" && course.lecturerId === user.id)) redirect(`/courses/${id}`);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <Link href={`/courses/${id}`} className="eyebrow transition-colors hover:text-ink">← {course.code}</Link>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">New quiz / poll</h1>
        <p className="mt-1 text-ink-soft">Prepare it now — then start it live during class from the video room.</p>
        <div className="mt-6">
          <QuizBuilder courseId={id} backHref={`/courses/${id}`} />
        </div>
      </main>
    </>
  );
}
