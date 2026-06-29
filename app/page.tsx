import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Nav from "@/components/Nav";

const features = [
  ["video.svg", "Live classes", "A real video room — camera, screen-share and open a document, with the lecturer in control."],
  ["link.svg", "Invite-link access", "Students can't see or join a class until they open your share link. You decide who's in."],
  ["clipboard-check.svg", "Attendance, automatic", "Joining the live class marks students present. Export the roll (with matric numbers) as CSV."],
  ["list-checks.svg", "Polls & quizzes", "Prepare them ahead, then start them live mid-class. Watch the results come in real time."],
  ["files.svg", "Materials", "Upload slides, notes and documents — students download them anytime, on any connection."],
  ["shield-check.svg", "Integrity checks", "See if a student is on multiple screens or has left the class screen — live, on your roster."],
];

const steps = [
  ["Schedule and share", "Create a class, then send students its private invite link."],
  ["Go live", "Start the room — screen-share, mute anyone, take hands, all from your screen."],
  ["Attend and assess", "Attendance is automatic; run a quiz or poll and export the results."],
];

export default async function Home() {
  const user = await getSession();
  if (user) redirect("/dashboard");

  return (
    <>
      <Nav />
      <main className="flex-1">
        {/* hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:py-24">
          <div className="text-center lg:text-left">
            <span className="eyebrow reveal inline-flex items-center gap-2" style={{ animationDelay: "0ms" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/uniabuja-crest.png" alt="" className="h-6 w-auto" />
              University of Abuja
            </span>
            <h1 className="reveal mt-4 font-display text-[2.6rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl" style={{ animationDelay: "80ms" }}>
              Your lectures,
              <br className="hidden sm:block" /> <span className="italic text-pine">live</span> and in one place.
            </h1>
            <p className="reveal mx-auto mt-5 max-w-md text-base text-ink-soft sm:text-lg lg:mx-0" style={{ animationDelay: "160ms" }}>
              Online Class turns every lecture into a live video room — with attendance,
              materials, and quizzes built in. Light enough to work on any network.
            </p>
            <div className="reveal mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start" style={{ animationDelay: "240ms" }}>
              <Link href="/register" className="btn btn-primary px-6 py-3 text-base">Get started — free</Link>
              <Link href="/login" className="btn btn-outline px-6 py-3 text-base">Log in</Link>
            </div>
            <div className="reveal mt-6 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-ink-soft lg:justify-start" style={{ animationDelay: "300ms" }}>
              <span>No app to install</span>
              <span aria-hidden>·</span>
              <span>Works on phones</span>
              <span aria-hidden>·</span>
              <span>Free to start</span>
            </div>
          </div>

          {/* product mock */}
          <div className="reveal" style={{ animationDelay: "320ms" }}>
            <ClassMock />
          </div>
        </section>

        {/* any-university strip */}
        <section className="border-y border-line bg-pine/5">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-1 px-5 py-4 text-center sm:flex-row sm:gap-3">
            <span className="font-display text-base font-semibold text-pine">Not at the University of Abuja?</span>
            <span className="text-sm text-ink-soft">Online Class works for any university or college — bring it to your campus.</span>
          </div>
        </section>

        {/* features */}
        <section className="bg-paper-2/40">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
            <p className="eyebrow text-center lg:text-left">Everything a class needs</p>
            <h2 className="mt-2 text-center font-display text-3xl font-semibold sm:text-4xl lg:text-left">Made for UniAbuja, ready for any campus</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(([icon, title, desc]) => (
                <div key={title} className="card p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-pine/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/icons/${icon}`} alt="" className="h-6 w-6" />
                  </span>
                  <h3 className="mt-3 font-display text-xl font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* how it works — dark band */}
        <section className="bg-pine-900 text-paper">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
            <p className="eyebrow text-paper/60">How it works</p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Three steps, start to finish</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {steps.map(([title, desc], i) => (
                <div key={title}>
                  <span className="font-display text-5xl font-semibold text-gold">{i + 1}</span>
                  <h3 className="mt-2 font-display text-xl font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-paper/70">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* audiences */}
        <section className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-7">
              <span className="chip status-upcoming">For lecturers</span>
              <h3 className="mt-3 font-display text-2xl font-semibold">Run the room, not the tech</h3>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                <li>Screen-share and open documents live</li>
                <li>Mute anyone, take raised hands</li>
                <li>Start prepared quizzes and polls mid-class</li>
                <li>Export attendance with matric numbers</li>
              </ul>
            </div>
            <div className="card p-7">
              <span className="chip status-open">For students</span>
              <h3 className="mt-3 font-display text-2xl font-semibold">Never miss what was taught</h3>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                <li>Join class from a single link</li>
                <li>Get marked present automatically</li>
                <li>Raise your hand, answer live quizzes</li>
                <li>Download every slide and note</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-5 pb-16 sm:pb-24">
          <div className="card flex flex-col items-center gap-5 p-8 text-center sm:p-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/uniabuja-crest.png" alt="University of Abuja" className="h-14 w-auto" />
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Bring your class online today</h2>
            <p className="max-w-md text-ink-soft">Create an account as a lecturer or student and run your first live class in minutes — at UniAbuja or any institution.</p>
            <Link href="/register" className="btn btn-primary px-7 py-3 text-base">Get started — free</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-8 text-sm text-ink-soft sm:flex-row">
          <span className="font-display text-base text-ink">Online Class</span>
          <span className="eyebrow text-[0.6rem]">Made for the University of Abuja · open to every campus</span>
        </div>
      </footer>
    </>
  );
}

function ClassMock() {
  return (
    <div className="card mx-auto max-w-md overflow-hidden p-3 sm:p-4">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="font-mono text-xs text-ink-soft">CSC 208 · Live</span>
        <span className="chip status-open">On air</span>
      </div>
      {/* stage */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-pine-700 to-pine-900">
        <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[0.65rem] font-semibold text-pine-900">Sharing screen</span>
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          {["A", "J", "D"].map((c) => (
            <span key={c} className="grid h-9 w-9 place-items-center rounded-lg bg-pine-900/80 text-xs font-semibold text-paper ring-1 ring-white/10">{c}</span>
          ))}
        </div>
      </div>
      {/* controls */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {["Mic", "Camera", "Share", "Mute all", "Quiz"].map((c) => (
          <span key={c} className="rounded-lg bg-paper-2 px-2.5 py-1.5 text-[0.7rem] font-medium text-ink">{c}</span>
        ))}
      </div>
      {/* live bits */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-paper-2 p-3 text-xs">
          <p className="eyebrow text-[0.55rem]">Attendance</p>
          <p className="mt-1 font-display text-lg font-semibold text-pine">42 / 45</p>
        </div>
        <div className="rounded-xl bg-paper-2 p-3 text-xs">
          <p className="eyebrow text-[0.55rem]">Hands up</p>
          <p className="mt-1 font-display text-lg font-semibold text-gold">3</p>
        </div>
      </div>
    </div>
  );
}
