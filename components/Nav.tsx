import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";

export default async function Nav() {
  const user = await getSession();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uniabuja-crest.png" alt="University of Abuja" className="h-9 w-auto" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[1.05rem] font-semibold tracking-tight">Online Class</span>
            <span className="eyebrow mt-0.5 text-[0.58rem]">Univ. of Abuja</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="rounded-lg px-3 py-1.5 text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink">Dashboard</Link>
              <Link href="/courses" className="rounded-lg px-3 py-1.5 text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink">Courses</Link>
              <span className="ml-1 hidden items-center gap-2 rounded-full border border-line bg-raised px-3 py-1.5 sm:flex">
                <span className={`h-1.5 w-1.5 rounded-full ${user.role === "LECTURER" ? "bg-gold" : "bg-pine"}`} />
                <span className="text-xs font-medium text-ink">{user.name.split(" ")[0]}</span>
                <span className="eyebrow text-[0.56rem]">{user.role === "LECTURER" ? "Lecturer" : "Student"}</span>
              </span>
              <form action={logoutAction}>
                <button className="rounded-lg px-3 py-1.5 text-ink-soft transition-colors hover:text-rust">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-1.5 text-ink-soft transition-colors hover:text-ink">Log in</Link>
              <Link href="/register" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
