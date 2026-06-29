import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Opening a class invite link unlocks that class for the student (enrolls them
// in the course + grants session access), then drops them on the course page.
export default async function JoinByLink({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const user = await getSession();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/join/${shareId}`)}`);

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

  redirect(`/courses/${session.courseId}`);
}
