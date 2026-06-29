import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCourseAction, enrollAction } from "@/lib/actions";
import Nav from "@/components/Nav";

export default async function CoursesPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  const isLecturer = user.role === "LECTURER";

  if (isLecturer) {
    const courses = await prisma.course.findMany({
      where: { lecturerId: user.id },
      include: { _count: { select: { enrollments: true, materials: true, sessions: true } } },
      orderBy: { createdAt: "desc" },
    });

    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
          <div className="reveal">
            <span className="eyebrow">Course catalogue</span>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Your courses</h1>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_340px]">
            <div className="reveal" style={{ animationDelay: "80ms" }}>
              {courses.length === 0 ? (
                <Empty>No courses yet — create your first one alongside.</Empty>
              ) : (
                <ul className="space-y-3">
                  {courses.map((c) => (
                    <li key={c.id}>
                      <Link href={`/courses/${c.id}`} className="card flex items-center justify-between gap-4 p-5 transition-transform hover:-translate-y-0.5">
                        <div>
                          <span className="font-mono text-xs tracking-wide text-gold">{c.code}</span>
                          <p className="mt-1 font-display text-xl font-semibold leading-tight">{c.title}</p>
                          <p className="mt-2 text-xs text-ink-soft">
                            {c._count.enrollments} students · {c._count.materials} materials · {c._count.sessions} sessions
                          </p>
                        </div>
                        <span className="font-display text-2xl text-line-2">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <aside className="card reveal h-fit p-6" style={{ animationDelay: "160ms" }}>
              <span className="eyebrow">New</span>
              <h2 className="mt-1 font-display text-2xl font-semibold">Create a course</h2>
              <form action={createCourseAction} className="mt-5 space-y-4">
                <div>
                  <label className="label" htmlFor="code">Course code</label>
                  <input id="code" name="code" required className="field font-mono" placeholder="CSC 208" />
                </div>
                <div>
                  <label className="label" htmlFor="title">Title</label>
                  <input id="title" name="title" required className="field" placeholder="Data Structures" />
                </div>
                <div>
                  <label className="label" htmlFor="description">Description</label>
                  <textarea id="description" name="description" rows={3} className="field resize-none" placeholder="What this course covers…" />
                </div>
                <button className="btn btn-primary w-full py-2.5">Create course</button>
              </form>
            </aside>
          </div>
        </main>
      </>
    );
  }

  const all = await prisma.course.findMany({
    include: { lecturer: true, enrollments: { where: { studentId: user.id } }, _count: { select: { materials: true, sessions: true } } },
    orderBy: { createdAt: "desc" },
  });
  const enrolled = all.filter((c) => c.enrollments.length > 0);
  const available = all.filter((c) => c.enrollments.length === 0);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <div className="reveal">
          <span className="eyebrow">Course catalogue</span>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Courses</h1>
        </div>

        <Section title="Enrolled" delay="80ms">
          {enrolled.length === 0 ? (
            <Empty>You aren&apos;t enrolled in any course yet.</Empty>
          ) : (
            <Grid>
              {enrolled.map((c) => (
                <Link key={c.id} href={`/courses/${c.id}`} className="card p-5 transition-transform hover:-translate-y-0.5">
                  <span className="font-mono text-xs tracking-wide text-gold">{c.code}</span>
                  <p className="mt-1 font-display text-lg font-semibold leading-tight">{c.title}</p>
                  <div className="my-3 rule-dotted" />
                  <p className="text-xs text-ink-soft">{c.lecturer.name} · {c._count.materials} materials</p>
                </Link>
              ))}
            </Grid>
          )}
        </Section>

        <Section title="Available to join" delay="160ms">
          {available.length === 0 ? (
            <Empty>No other courses available right now.</Empty>
          ) : (
            <Grid>
              {available.map((c) => (
                <div key={c.id} className="card flex flex-col p-5">
                  <span className="font-mono text-xs tracking-wide text-gold">{c.code}</span>
                  <p className="mt-1 font-display text-lg font-semibold leading-tight">{c.title}</p>
                  <p className="mt-2 text-xs text-ink-soft">{c.lecturer.name}</p>
                  <form action={enrollAction} className="mt-4">
                    <input type="hidden" name="courseId" value={c.id} />
                    <button className="btn btn-outline w-full">Enroll</button>
                  </form>
                </div>
              ))}
            </Grid>
          )}
        </Section>
      </main>
    </>
  );
}

function Section({ title, delay, children }: { title: string; delay: string; children: React.ReactNode }) {
  return (
    <section className="reveal mt-10" style={{ animationDelay: delay }}>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="eyebrow">{title}</h2>
        <span className="h-px flex-1 bg-line" />
      </div>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line-2 bg-paper-2/50 p-6 text-sm text-ink-soft">{children}</p>;
}
