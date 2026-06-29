import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDateTime, fmtBytes, sessionWindow } from "@/lib/format";
import {
  uploadMaterialAction,
  createSessionAction,
  enrollAction,
  markAttendanceAction,
  startLiveAction,
} from "@/lib/actions";
import Nav from "@/components/Nav";
import CopyLink from "@/components/CopyLink";

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      lecturer: true,
      materials: { orderBy: { createdAt: "desc" } },
      sessions: {
        orderBy: { startsAt: "asc" },
        include: {
          attendances: { include: { student: true } },
          access: { where: { studentId: user.id } },
        },
      },
      enrollments: { where: { studentId: user.id } },
      quizzes: { include: { _count: { select: { questions: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!course) notFound();

  const isOwner = user.role === "LECTURER" && course.lecturerId === user.id;
  const isEnrolled = course.enrollments.length > 0;
  // Students only see classes they've unlocked via the lecturer's invite link.
  const sessions = isOwner ? course.sessions : course.sessions.filter((s) => s.access.length > 0);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <Link href="/courses" className="eyebrow transition-colors hover:text-ink">← All courses</Link>

        {/* header */}
        <div className="reveal mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-8">
          <div className="max-w-2xl">
            <span className="font-mono text-xs tracking-wide text-gold">{course.code}</span>
            <h1 className="mt-1.5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{course.title}</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Taught by <span className="font-medium text-ink">{course.lecturer.name}</span>
            </p>
            {course.description && <p className="mt-4 leading-relaxed text-ink-soft">{course.description}</p>}
          </div>
          {!isOwner && !isEnrolled && (
            <form action={enrollAction}>
              <input type="hidden" name="courseId" value={course.id} />
              <button className="btn btn-gold">Enroll in this course</button>
            </form>
          )}
          {isEnrolled && <span className="chip status-open">✓ Enrolled</span>}
          {isOwner && <span className="chip status-upcoming">Your course</span>}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Materials */}
          <section className="reveal" style={{ animationDelay: "80ms" }}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="eyebrow">Materials</h2>
              <span className="h-px flex-1 bg-line" />
            </div>

            {isOwner && (
              <form action={uploadMaterialAction} className="card mb-4 space-y-3 p-4">
                <input type="hidden" name="courseId" value={course.id} />
                <input name="title" placeholder="Material title (e.g. Lecture 1 slides)" required className="field" />
                <input type="file" name="file" required className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-pine file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-paper hover:file:bg-pine-700" />
                <button className="btn btn-primary">Upload document</button>
              </form>
            )}

            {course.materials.length === 0 ? (
              <Empty>No materials uploaded yet.</Empty>
            ) : (
              <ul className="space-y-2.5">
                {course.materials.map((m) => (
                  <li key={m.id} className="card flex items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-paper-2 font-mono text-xs text-ink-soft">DOC</span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{m.title}</p>
                        <p className="truncate text-xs text-ink-soft">{m.fileName} · {fmtBytes(m.size)}</p>
                      </div>
                    </div>
                    <a href={m.fileUrl} target="_blank" rel="noreferrer" download className="btn btn-outline shrink-0 px-3 py-1.5 text-sm">
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Schedule + attendance */}
          <section className="reveal" style={{ animationDelay: "160ms" }}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="eyebrow">Schedule &amp; attendance</h2>
              <span className="h-px flex-1 bg-line" />
            </div>

            {isOwner && (
              <form action={createSessionAction} className="card mb-4 space-y-3 p-4">
                <input type="hidden" name="courseId" value={course.id} />
                <input name="title" placeholder="Class title (e.g. Week 1 — Intro)" required className="field" />
                <div className="grid grid-cols-2 gap-2">
                  <label className="label text-xs">Starts
                    <input type="datetime-local" name="startsAt" required className="field mt-1" />
                  </label>
                  <label className="label text-xs">Ends
                    <input type="datetime-local" name="endsAt" required className="field mt-1" />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select name="mode" className="field">
                    <option value="PHYSICAL">Physical</option>
                    <option value="ONLINE">Online</option>
                  </select>
                  <input name="location" placeholder="Room / link" className="field" />
                </div>
                <button className="btn btn-primary">Schedule class</button>
              </form>
            )}

            {sessions.length === 0 ? (
              <Empty>
                {isOwner
                  ? "No classes scheduled yet."
                  : "No classes yet — open a class link from your lecturer to join one."}
              </Empty>
            ) : (
              <ul className="space-y-2.5">
                {sessions.map((s) => {
                  const w = sessionWindow(s.startsAt, s.endsAt);
                  const mine = s.attendances.find((a) => a.studentId === user.id);
                  return (
                    <li key={s.id} className="card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-lg font-semibold leading-tight">{s.title}</p>
                          <p className="mt-1 text-xs text-ink-soft">{fmtDateTime(s.startsAt)} → {fmtDateTime(s.endsAt)}</p>
                          <p className="text-xs text-ink-soft">
                            {s.mode === "ONLINE" ? "🖥 Online" : "📍 Physical"}{s.location ? ` · ${s.location}` : ""}
                          </p>
                        </div>
                        <Badge window={w} />
                      </div>

                      {isOwner && (
                        <div className="mt-3 border-t border-line pt-3">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <CopyLink path={`/join/${s.shareId}`} label="Copy invite link" />
                            <span className="text-[0.7rem] text-ink-soft">Send this to students so they can join</span>
                          </div>
                          {w === "open" && (
                            <form action={startLiveAction} className="mb-3">
                              <input type="hidden" name="sessionId" value={s.id} />
                              <button className="btn btn-gold py-1.5">
                                {s.startedAt ? "● Re-enter live class" : "● Start live class"}
                              </button>
                            </form>
                          )}
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="eyebrow text-[0.6rem]">Roll · {s.attendances.length} present</p>
                            {s.attendances.length > 0 && (
                              <a
                                href={`/api/attendance/export?session=${s.id}`}
                                className="text-[0.7rem] font-medium text-pine underline-offset-2 hover:underline"
                              >
                                ⬇ Matric list (CSV)
                              </a>
                            )}
                          </div>
                          {s.attendances.length > 0 ? (
                            <ul className="flex flex-wrap gap-1.5">
                              {s.attendances.map((a) => (
                                <li key={a.id} className="chip status-open">
                                  {a.student.matric ? <span className="font-mono">{a.student.matric}</span> : a.student.name}
                                  {a.status === "LATE" ? " · late" : ""}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-ink-soft">No one has marked attendance yet.</p>
                          )}
                        </div>
                      )}

                      {!isOwner && isEnrolled && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                          {w === "open" && (
                            <Link href={`/courses/${course.id}/live/${s.id}`} className="btn btn-gold py-1.5">
                              ● Join live class
                            </Link>
                          )}
                          {mine ? (
                            <span className="chip status-open">✓ Attendance marked{mine.status === "LATE" ? " · late" : ""}</span>
                          ) : w === "open" ? (
                            <form action={markAttendanceAction}>
                              <input type="hidden" name="sessionId" value={s.id} />
                              <button className="btn btn-outline py-1.5">Just mark attendance</button>
                            </form>
                          ) : (
                            <span className="text-sm text-ink-soft">
                              {w === "upcoming" ? "Opens 30 min before class" : "Attendance closed"}
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Quizzes & polls (lecturer prepares ahead; starts them live in class) */}
        {isOwner && (
          <section className="mt-8 border-t border-line pt-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="eyebrow">Quizzes &amp; polls</h2>
              <Link href={`/courses/${course.id}/quiz/new`} className="btn btn-gold px-3 py-1.5 text-sm">+ New quiz / poll</Link>
            </div>
            {course.quizzes.length === 0 ? (
              <Empty>None yet — prepare a quiz or poll, then start it live during class.</Empty>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {course.quizzes.map((q) => (
                  <li key={q.id} className="card p-4">
                    <span className="chip status-upcoming">{q.kind === "QUIZ" ? "Quiz" : "Poll"}</span>
                    <p className="mt-2 font-display text-lg font-semibold leading-tight">{q.title}</p>
                    <p className="mt-1 text-xs text-ink-soft">{q._count.questions} question{q._count.questions === 1 ? "" : "s"} · start it from the live class</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </>
  );
}

function Badge({ window }: { window: "upcoming" | "open" | "closed" }) {
  const cls = { open: "status-open", upcoming: "status-upcoming", closed: "status-closed" }[window];
  const label = { open: "● Open now", upcoming: "Upcoming", closed: "Ended" }[window];
  return <span className={`chip shrink-0 ${cls}`}>{label}</span>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line-2 bg-paper-2/50 p-6 text-sm text-ink-soft">{children}</p>;
}
