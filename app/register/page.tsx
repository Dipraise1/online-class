import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { registerAction } from "@/lib/actions";
import Nav from "@/components/Nav";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  if (await getSession()) redirect("/dashboard");
  const { error, next } = await searchParams;

  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <div className="reveal">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uniabuja-crest.png" alt="University of Abuja" className="mb-5 h-12 w-auto" />
          <span className="eyebrow">Join Online Class</span>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
            Create your <span className="italic text-pine">account</span>.
          </h1>
          <p className="mt-2 text-ink-soft">For students and lecturers of University of Abuja.</p>
        </div>

        <div className="card reveal mt-8 p-6" style={{ animationDelay: "80ms" }}>
          {error && (
            <p className="mb-4 rounded-lg border border-rust/30 bg-rust/10 px-3 py-2 text-sm text-rust">{error}</p>
          )}
          <form action={registerAction} className="space-y-4">
            <input type="hidden" name="next" value={next ?? ""} />
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" name="name" required className="field" placeholder="Divine Evna Olong" />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required className="field" placeholder="you@uniabuja.edu.ng" />
            </div>
            <div>
              <label className="label" htmlFor="matric">Matric number <span className="font-normal text-ink-soft/70">(students)</span></label>
              <input id="matric" name="matric" className="field font-mono" placeholder="[redacted]" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required minLength={6} className="field" placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="label" htmlFor="role">I am a…</label>
              <select id="role" name="role" defaultValue="STUDENT" className="field">
                <option value="STUDENT">Student</option>
                <option value="LECTURER">Lecturer</option>
              </select>
            </div>
            <button className="btn btn-primary w-full py-2.5">Create account</button>
          </form>
        </div>

        <p className="reveal mt-6 text-center text-sm text-ink-soft" style={{ animationDelay: "140ms" }}>
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-pine underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </main>
    </>
  );
}
