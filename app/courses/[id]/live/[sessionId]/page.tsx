import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDateTime, sessionWindow } from "@/lib/format";
import Classroom from "@/components/Classroom";
import AutoRefresh from "@/components/AutoRefresh";

export default async function LiveClassPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id, sessionId } = await params;

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      course: { include: { enrollments: { where: { studentId: user.id } } } },
      access: { where: { studentId: user.id } },
    },
  });
  if (!session || session.courseId !== id) notFound();

  const isOwner = user.role === "LECTURER" && session.course.lecturerId === user.id;
  const hasAccess = session.access.length > 0;
  // Students must have unlocked this class via the lecturer's invite link.
  if (!isOwner && !hasAccess) redirect(`/courses/${id}`);

  const win = sessionWindow(session.startsAt, session.endsAt);
  const backHref = `/courses/${id}`;

  // ---- Lecturer: entering keeps the class live ----
  if (isOwner) {
    if (win !== "closed" && !session.startedAt) {
      await prisma.classSession.update({ where: { id: sessionId }, data: { startedAt: new Date() } });
    }
    return <Room session={session} user={user} backHref={backHref} isModerator />;
  }

  // ---- Student gates ----
  if (win === "closed") {
    return (
      <Waiting title="This class has ended" sub={`${session.course.code} · ${session.title}`} backHref={backHref}>
        <p className="text-paper/70">It ran {fmtDateTime(session.startsAt)} → {fmtDateTime(session.endsAt)}.</p>
      </Waiting>
    );
  }
  if (win === "upcoming") {
    return (
      <Waiting title="Class hasn't started yet" sub={`${session.course.code} · ${session.title}`} backHref={backHref} poll>
        <p className="text-paper/70">Scheduled for <span className="text-paper">{fmtDateTime(session.startsAt)}</span>.</p>
        <p className="mt-1 text-sm text-paper/50">This page will let you in automatically once your lecturer goes live.</p>
      </Waiting>
    );
  }
  if (!session.startedAt) {
    return (
      <Waiting title="Waiting for your lecturer…" sub={`${session.course.code} · ${session.title}`} backHref={backHref} poll>
        <p className="text-paper/70">The class is open — your lecturer hasn&apos;t started the live room yet.</p>
        <p className="mt-1 text-sm text-paper/50">Hang tight, you&apos;ll join automatically the moment it begins.</p>
      </Waiting>
    );
  }

  // open + started → mark attendance and join
  const status = new Date() > session.startsAt ? "LATE" : "PRESENT";
  await prisma.attendance.upsert({
    where: { sessionId_studentId: { sessionId, studentId: user.id } },
    update: {},
    create: { sessionId, studentId: user.id, status },
  });

  return <Room session={session} user={user} backHref={backHref} isModerator={false} attended />;
}

/* ---------- room layout ---------- */
function Room({
  session,
  user,
  backHref,
  isModerator,
  attended,
}: {
  session: { id: string; title: string; course: { code: string } };
  user: { name: string };
  backHref: string;
  isModerator: boolean;
  attended?: boolean;
}) {
  return (
    <div className="flex h-screen flex-col bg-pine-900">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-pine-900 px-4 py-2.5 text-paper">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uniabuja-crest.png" alt="University of Abuja" className="h-8 w-auto" />
          <div className="leading-tight">
            <p className="font-display text-base font-semibold">{session.title}</p>
            <p className="text-xs text-paper/60">
              <span className="font-mono">{session.course.code}</span> · Live class
              <span className="ml-2 text-gold">● on air</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {attended && (
            <span className="hidden rounded-full bg-white/10 px-3 py-1 text-xs sm:inline">✓ Attendance recorded</span>
          )}
          {isModerator && (
            <span className="hidden rounded-full bg-gold/20 px-3 py-1 text-xs text-gold sm:inline">You are the host</span>
          )}
          <Link href={backHref} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20">Leave class</Link>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <Classroom sessionId={session.id} backHref={backHref} />
      </div>
    </div>
  );
}

/* ---------- waiting / ended layout ---------- */
function Waiting({
  title,
  sub,
  backHref,
  poll,
  children,
}: {
  title: string;
  sub: string;
  backHref: string;
  poll?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-pine-900 px-6 text-center text-paper">
      {poll && <AutoRefresh seconds={8} />}
      <div className="max-w-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/uniabuja-crest.png" alt="University of Abuja" className="mx-auto h-16 w-auto" />
        {poll && (
          <div className="mx-auto mt-6 flex h-3 w-3">
            <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-gold opacity-70" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-gold" />
          </div>
        )}
        <h1 className="mt-6 font-display text-3xl font-semibold">{title}</h1>
        <p className="eyebrow mt-2 text-paper/60">{sub}</p>
        <div className="mt-4 leading-relaxed">{children}</div>
        <Link href={backHref} className="btn btn-gold mt-8">← Back to course</Link>
      </div>
    </div>
  );
}
