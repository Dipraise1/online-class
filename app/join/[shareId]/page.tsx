import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";

// Opening a class invite link unlocks that class for the student (enrolls them
// in the course + grants session access), then drops them on the course page.
export default async function JoinByLink({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const user = await getSession();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/join/${shareId}`)}`);

  // Guard against stale sessions: a signed cookie whose user no longer exists
  // (e.g. the account was removed). Without this, the writes below fail a
  // foreign-key check and the page 500s.
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true } });
  if (!dbUser) {
    return (
      <div className="grid min-h-screen place-items-center bg-pine-900 px-6 text-center text-paper">
        <div className="max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uniabuja-crest.png" alt="University of Abuja" className="mx-auto h-14 w-auto" />
          <h1 className="mt-6 font-display text-3xl font-semibold">Please log in again</h1>
          <p className="mt-2 text-paper/70">
            Your session is no longer valid. Log in again, then re-open the class link.
          </p>
          <form action={logoutAction} className="mt-6">
            <button className="btn btn-gold">Log in again</button>
          </form>
        </div>
      </div>
    );
  }

  const session = await prisma.classSession.findUnique({
    where: { shareId },
    include: { course: true },
  });
  if (!session) notFound();

  // Lecturer who owns it just goes to the course.
  if (user.role === "LECTURER" && session.course.lecturerId === user.id) {
    redirect(`/courses/${session.courseId}`);
  }

  // Student: ensure enrollment + unlock this session.
  try {
    await prisma.enrollment.upsert({
      where: { courseId_studentId: { courseId: session.courseId, studentId: user.id } },
      update: {},
      create: { courseId: session.courseId, studentId: user.id },
    });
    await prisma.sessionAccess.upsert({
      where: { sessionId_studentId: { sessionId: session.id, studentId: user.id } },
      update: {},
      create: { sessionId: session.id, studentId: user.id },
    });
  } catch {
    // best-effort: if access already exists or a write hiccups, still send them on
  }

  redirect(`/courses/${session.courseId}`);
}
