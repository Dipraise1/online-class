import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loginAction } from "@/lib/actions";
import Nav from "@/components/Nav";

export default async function LoginPage({
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
          <span className="eyebrow">Welcome back</span>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
            Log in to <span className="italic text-pine">class</span>.
          </h1>
          <p className="mt-2 text-ink-soft">Your courses, schedule and attendance are waiting.</p>
        </div>

        <div className="card reveal mt-8 p-6" style={{ animationDelay: "80ms" }}>
          {error && (
            <p className="mb-4 rounded-lg border border-rust/30 bg-rust/10 px-3 py-2 text-sm text-rust">{error}</p>
          )}
          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="next" value={next ?? ""} />
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required className="field" placeholder="you@uniabuja.edu.ng" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required className="field" placeholder="••••••••" />
            </div>
            <button className="btn btn-primary w-full py-2.5">Log in</button>
          </form>
        </div>

        <p className="reveal mt-6 text-center text-sm text-ink-soft" style={{ animationDelay: "140ms" }}>
          New here?{" "}
          <Link href="/register" className="font-semibold text-pine underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </main>
    </>
  );
}
