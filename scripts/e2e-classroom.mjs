import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
const mint = (u) => new SignJWT({ id: u.id, name: u.name, role: u.role })
  .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);

async function retry(fn, n = 5) {
  for (let i = 0; i < n; i++) {
    try { return await fn(); } catch (e) { if (i === n - 1) throw e; await new Promise((r) => setTimeout(r, 2000)); }
  }
}

const course = await retry(() => prisma.course.findUnique({
  where: { id: "cmqzk6sul00031qeg3elgjvl8" },
  include: { sessions: true },
}));
const live = course.sessions.find((s) => s.title.includes("join anytime"));
const teacher = await prisma.user.findUnique({ where: { email: "teacher@test.com" } });
const student = await prisma.user.findUnique({ where: { email: "student@test.com" } });
const tCookie = await mint(teacher);
const sCookie = await mint(student);
await prisma.$disconnect();

const BASE = process.env.BASE || "http://localhost:3000";
const URL = `${BASE}/courses/${course.id}/live/${live.id}`;
const args = ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"];
const browser = await chromium.launch({ channel: "chrome", args });
let fails = 0;
const ok = (c, m) => { console.log((c ? "✓" : "✗") + " " + m); if (!c) fails++; };
const baseHost = new globalThis.URL(BASE).hostname;
const baseSecure = new globalThis.URL(BASE).protocol === "https:";
const ck = (v) => ({ name: "oc_session", value: v, domain: baseHost, path: "/", httpOnly: true, sameSite: "Lax", secure: baseSecure });

const tctx = await browser.newContext({ viewport: { width: 1280, height: 820 }, permissions: ["camera", "microphone"] });
await tctx.addCookies([ck(tCookie)]);
const tp = await tctx.newPage();

const sctx = await browser.newContext({ viewport: { width: 1280, height: 820 }, permissions: ["camera", "microphone"] });
await sctx.addCookies([ck(sCookie)]);
const sp = await sctx.newPage();

// teacher joins first (host)
await tp.goto(URL, { waitUntil: "domcontentloaded" });
await tp.waitForTimeout(11000);
ok(await tp.getByText(/Share screen|Pass attendance/).first().isVisible().catch(() => false), "teacher sees host controls (share / attendance)");

// student joins
await sp.goto(URL, { waitUntil: "domcontentloaded" });
await sp.waitForTimeout(13000);
ok(await sp.getByText(/Raise hand/).first().isVisible().catch(() => false), "student sees Raise hand control");

// both connected — teacher should see 1 student
await tp.waitForTimeout(2000);
ok((await tp.content()).includes("1 student"), "teacher sees 1 student in the room");
ok((await tp.content()).includes(student.matric), `teacher roster shows student matric (${student.matric})`);

// CSV export of attendance (matric list) — lecturer only
const csv = await tctx.request.get(`${BASE}/api/attendance/export?session=${live.id}`);
const csvText = await csv.text();
ok(csv.ok() && csvText.includes("Matric") && csvText.includes(student.matric), "lecturer can export attendance CSV with matric");

// student raises hand → teacher sees it
await sp.getByText("✋ Raise hand").first().click();
await tp.waitForTimeout(2500);
ok((await tp.content()).includes("Test Student"), "raised hand shows on teacher's screen");

// teacher passes attendance → student modal → mark present
await tp.getByText("Pass attendance").first().click();
await sp.waitForTimeout(2500);
ok(await sp.getByText("taking attendance").first().isVisible().catch(() => false), "student sees attendance pop-up");
await sp.getByText("I'm present").first().click();
await sp.waitForTimeout(6000);
ok(await sp.getByText(/marked present/).first().isVisible().catch(() => false), "student sees 'marked present' confirmation");
await tp.waitForTimeout(3000);
ok((await tp.content()).includes("1/1") || (await tp.content()).includes("Stop attendance · 1"), "teacher attendance count updates to 1");

// abc proctor: simulate the student leaving the class screen (tab hidden)
await sp.evaluate(() => {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
  document.dispatchEvent(new Event("visibilitychange"));
});
await tp.waitForTimeout(3000);
ok((await tp.content()).includes("away from screen") || (await tp.content()).includes("👀 away"),
  "abc: teacher sees student left the screen");

await tp.screenshot({ path: "/tmp/oc-shots/classroom-teacher.png" });
await sp.screenshot({ path: "/tmp/oc-shots/classroom-student.png" });

await browser.close();
console.log(fails === 0 ? "\nCLASSROOM OK" : `\n${fails} FAILED`);
process.exit(fails ? 1 : 0);
