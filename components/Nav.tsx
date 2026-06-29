import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";

export default async function Nav() {
  const user = await getSession();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-5 sm:py-3.5">
        <Link href={user ? "/dashboard" : "/"} className="flex shrink-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uniabuja-crest.png" alt="University of Abuja" className="h-8 w-auto sm:h-9" />
          <span className="hidden flex-col leading-none min-[420px]:flex">
            <span className="font-display text-[1rem] font-semibold tracking-tight sm:text-[1.05rem]">Online Class</span>
            <span className="eyebrow mt-0.5 hidden text-[0.58rem] sm:block">Univ. of Abuja</span>
          </span>
        </Link>

        <div className="flex items-center gap-0.5 text-sm sm:gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink sm:px-3">Dashboard</Link>
              <Link href="/courses" className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink sm:px-3">Courses</Link>
              <span className="ml-1 hidden items-center gap-2 rounded-full border border-line bg-raised px-3 py-1.5 sm:flex">
                <span className={`h-1.5 w-1.5 rounded-full ${user.role === "LECTURER" ? "bg-gold" : "bg-pine"}`} />
                <span className="text-xs font-medium text-ink">{user.name.split(" ")[0]}</span>
                <span className="eyebrow text-[0.56rem]">{user.role === "LECTURER" ? "Lecturer" : "Student"}</span>
              </span>
              <form action={logoutAction}>
                <button className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-ink-soft transition-colors hover:text-rust sm:px-3">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-ink-soft transition-colors hover:text-ink sm:px-3">Log in</Link>
              <Link href="/register" className="btn btn-primary whitespace-nowrap">Sign up</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
