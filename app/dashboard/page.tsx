import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDateTime, sessionWindow } from "@/lib/format";
import Nav from "@/components/Nav";

export default async function Dashboard() {
  const user = await getSession();
  if (!user) redirect("/login");

  const isLecturer = user.role === "LECTURER";

  const courses = isLecturer
    ? await prisma.course.findMany({
        where: { lecturerId: user.id },
        include: { _count: { select: { enrollments: true, materials: true } } },
        orderBy: { createdAt: "desc" },
      })
    : await prisma.course.findMany({
        where: { enrollments: { some: { studentId: user.id } } },
        include: { lecturer: true, _count: { select: { materials: true } } },
        orderBy: { createdAt: "desc" },
      });

  const courseIds = courses.map((c) => c.id);
  const upcoming = await prisma.classSession.findMany({
    where: {
      courseId: { in: courseIds },
      endsAt: { gte: new Date() },
      // students only see classes they've unlocked via an invite link
      ...(isLecturer ? {} : { access: { some: { studentId: user.id } } }),
    },
    include: { course: true },
    orderBy: { startsAt: "asc" },
    take: 5,
  });

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">{isLecturer ? "Lecturer desk" : "Student desk"}</span>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
              Hello, <span className="italic text-pine">{user.name.split(" ")[0]}</span>.
            </h1>
            <p className="mt-1 text-ink-soft">
              {isLecturer ? "Your courses, schedule and class rolls." : "What's next and what you've joined."}
            </p>
          </div>
          {isLecturer && (
            <Link href="/courses" className="btn btn-gold">+ New course</Link>
          )}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          {/* upcoming */}
          <section className="reveal" style={{ animationDelay: "80ms" }}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="eyebrow">Upcoming classes</h2>
              <span className="h-px flex-1 bg-line" />
            </div>
            {upcoming.length === 0 ? (
              <Empty>No upcoming classes scheduled.</Empty>
            ) : (
              <ul className="space-y-2.5">
                {upcoming.map((s) => {
                  const w = sessionWindow(s.startsAt, s.endsAt);
                  const href = w === "open" ? `/courses/${s.courseId}/live/${s.id}` : `/courses/${s.courseId}`;
                  return (
                    <li key={s.id}>
                      <Link href={href} className="card flex items-center justify-between gap-3 p-4 transition-transform hover:-translate-y-0.5">
                        <div className="min-w-0">
                          <p className="truncate font-display text-lg font-semibold leading-tight">{s.title}</p>
                          <p className="mt-0.5 truncate text-sm text-ink-soft">
                            <span className="font-mono text-xs">{s.course.code}</span> · {fmtDateTime(s.startsAt)}
                          </p>
                        </div>
                        <Badge window={w} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* courses */}
          <section className="reveal" style={{ animationDelay: "160ms" }}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="eyebrow">{isLecturer ? "Your courses" : "Enrolled courses"}</h2>
              <span className="h-px flex-1 bg-line" />
            </div>
            {courses.length === 0 ? (
              <Empty>
                {isLecturer ? (
                  <>No courses yet. <Link href="/courses" className="font-semibold text-pine">Create one →</Link></>
                ) : (
                  <>Not enrolled in any course. <Link href="/courses" className="font-semibold text-pine">Browse courses →</Link></>
                )}
              </Empty>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {courses.map((c) => {
                  const counts = c._count as { enrollments?: number; materials: number };
                  return (
                    <Link key={c.id} href={`/courses/${c.id}`} className="card group p-5 transition-transform hover:-translate-y-0.5">
                      <span className="font-mono text-xs tracking-wide text-gold">{c.code}</span>
                      <p className="mt-1 font-display text-lg font-semibold leading-tight">{c.title}</p>
                      <div className="my-3 rule-dotted" />
                      <p className="text-xs text-ink-soft">
                        {counts.enrollments != null ? `${counts.enrollments} students · ` : ""}
                        {counts.materials} materials
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function Badge({ window }: { window: "upcoming" | "open" | "closed" }) {
  const cls = { open: "status-open", upcoming: "status-upcoming", closed: "status-closed" }[window];
  const label = { open: "● Join live", upcoming: "Upcoming", closed: "Ended" }[window];
  return <span className={`chip shrink-0 ${cls}`}>{label}</span>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-line-2 bg-paper-2/50 p-6 text-sm text-ink-soft">
      {children}
    </p>
  );
}
