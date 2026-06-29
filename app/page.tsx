import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Nav from "@/components/Nav";

const features = [
  ["01", "Live classes", "Meet your lecturer and classmates in a built-in video room — camera, mic, screen-share & chat. No extra app to install."],
  ["02", "Materials", "Lecturers publish slides, notes & documents — students download them anytime, on any connection."],
  ["03", "Attendance", "Join the live class and you're marked present automatically. Lecturers watch the roll fill in real time."],
];

export default async function Home() {
  const user = await getSession();
  if (user) redirect("/dashboard");

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5">
        {/* hero */}
        <section className="grid items-center gap-10 py-16 md:grid-cols-[1.15fr_0.85fr] md:py-24">
          <div>
            <div className="reveal flex items-center gap-3" style={{ animationDelay: "0ms" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/uniabuja-crest.png" alt="University of Abuja crest" className="h-11 w-auto" />
              <span className="eyebrow leading-tight">
                University of Abuja
                <br />Yakubu Gowon University
              </span>
            </div>
            <h1 className="reveal mt-5 font-display text-5xl font-semibold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl" style={{ animationDelay: "80ms" }}>
              The lecture hall,
              <br />
              <span className="italic text-pine">live</span> wherever you are.
            </h1>
            <p className="reveal mt-6 max-w-md text-lg leading-relaxed text-ink-soft" style={{ animationDelay: "160ms" }}>
              Online Class puts your lectures in a live video room — your
              lecturer, your classmates, your materials and attendance, all in
              one place. Light enough to work on any network.
            </p>
            <div className="reveal mt-9 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
              <Link href="/register" className="btn btn-primary px-6 py-3 text-base">Get started — it&apos;s free</Link>
              <Link href="/login" className="btn btn-outline px-6 py-3 text-base">I have an account</Link>
            </div>
          </div>

          {/* decorative "class card" */}
          <div className="reveal" style={{ animationDelay: "320ms" }}>
            <div className="card relative overflow-hidden p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-wide text-ink-soft">CSC&nbsp;208</span>
                <span className="chip status-open">● Open now</span>
              </div>
              <h3 className="mt-3 font-display text-2xl font-semibold leading-tight">
                Data Structures &amp; Algorithms
              </h3>
              <p className="mt-1 text-sm text-ink-soft">Week 1 — Arrays &amp; Lists</p>

              {/* faux video tiles */}
              <div className="mt-5 grid grid-cols-3 gap-2">
                {["A", "J", "D", "F", "K", "+38"].map((c, i) => (
                  <span
                    key={i}
                    className="grid aspect-video place-items-center rounded-lg bg-pine-900 font-display text-sm font-semibold text-paper/90"
                    style={{ background: i % 2 ? "#0e4636" : "#0a3127" }}
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl bg-paper-2 p-3 text-sm">
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-70" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
                  </span>
                  <span className="font-semibold">Live now</span>
                </span>
                <span className="text-ink-soft">43 in the room · you&apos;re marked present</span>
              </div>
            </div>
          </div>
        </section>

        {/* feature ledger */}
        <section className="border-t border-line py-14">
          <p className="eyebrow">What you get</p>
          <div className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
            {features.map(([n, title, desc]) => (
              <div key={n} className="bg-raised p-6">
                <span className="font-display text-3xl font-semibold text-gold">{n}</span>
                <h3 className="mt-3 font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 text-sm text-ink-soft sm:flex-row">
          <span className="font-display text-base">Online Class</span>
          <span className="eyebrow text-[0.6rem]">Built for University of Abuja</span>
        </div>
      </footer>
    </>
  );
}
