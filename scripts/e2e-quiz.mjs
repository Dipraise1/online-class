import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const BASE = process.env.BASE || "http://localhost:3000";
const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
async function retry(fn, n = 6) { for (let i = 0; i < n; i++) { try { return await fn(); } catch (e) { if (i === n - 1) throw e; await new Promise((r) => setTimeout(r, 2000)); } } }
const mint = (u) => new SignJWT({ id: u.id, name: u.name, role: u.role }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);

const course = await retry(() => prisma.course.findFirst({ where: { code: "CSC 101" }, include: { sessions: true }, orderBy: { createdAt: "desc" } }));
const live = course.sessions.find((s) => s.title.includes("join anytime"));
const teacher = await prisma.user.findUnique({ where: { email: "teacher@test.com" } });
const student = await prisma.user.findUnique({ where: { email: "student@test.com" } });
await retry(() => prisma.sessionAccess.deleteMany({ where: { studentId: student.id } }));
await retry(() => prisma.quiz.deleteMany({ where: { courseId: course.id } }));
const tCookie = await mint(teacher);
const sCookie = await mint(student);
await prisma.$disconnect();

const host = new globalThis.URL(BASE).hostname;
const secure = new globalThis.URL(BASE).protocol === "https:";
const ck = (v) => ({ name: "oc_session", value: v, domain: host, path: "/", httpOnly: true, sameSite: "Lax", secure });
const liveURL = `${BASE}/courses/${course.id}/live/${live.id}`;

const browser = await chromium.launch({ channel: "chrome", args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
let fails = 0; const ok = (c, m) => { console.log((c ? "✓" : "✗") + " " + m); if (!c) fails++; };

const tctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, permissions: ["camera", "microphone"] });
await tctx.addCookies([ck(tCookie)]);
const tp = await tctx.newPage();

// ---- Part A: builder ----
await tp.goto(`${BASE}/courses/${course.id}/quiz/new`, { waitUntil: "networkidle" });
await tp.waitForTimeout(1500); // allow hydration before interacting
await tp.getByPlaceholder("e.g. Week 1 — Quick check").fill("Live Pop Quiz");
await tp.getByRole("button", { name: /Quiz \(mark correct/ }).click();
await tp.locator('input[name="correct-0"]').first().waitFor({ state: "visible", timeout: 10000 });
await tp.getByPlaceholder("Question text").fill("What is 2 + 2?");
await tp.getByPlaceholder("Option 1").fill("3");
await tp.getByPlaceholder("Option 2").fill("4");
await tp.locator('input[name="correct-0"]').nth(1).check();
await tp.getByRole("button", { name: "Save quiz / poll" }).click();
await tp.waitForURL(`**/courses/${course.id}`, { timeout: 15000 }).catch(() => {});
await tp.waitForTimeout(800);
ok((await tp.content()).includes("Live Pop Quiz"), "builder: quiz saved and shows on course page");

// ---- Part B: live ----
await tp.goto(liveURL, { waitUntil: "domcontentloaded" });
await tp.waitForTimeout(11000);

const sctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, permissions: ["camera", "microphone"] });
await sctx.addCookies([ck(sCookie)]);
const sp = await sctx.newPage();
await sp.goto(`${BASE}/join/${live.shareId}`, { waitUntil: "domcontentloaded" });
await sp.waitForTimeout(2000);
await sp.goto(liveURL, { waitUntil: "domcontentloaded" });
await sp.waitForTimeout(13000);

// teacher starts the quiz
await tp.getByText("📋 Quiz / Poll").click();
await tp.waitForTimeout(1500);
await tp.getByRole("button", { name: "Start" }).first().click();
await tp.waitForTimeout(2500);

// student sees + answers
const modalShown = await sp.getByText("Live Pop Quiz").first().waitFor({ state: "visible", timeout: 15000 }).then(() => true).catch(() => false);
ok(modalShown, "student sees the quiz pop-up");
await sp.getByText("4", { exact: true }).click();
await sp.getByRole("button", { name: "Submit answers" }).click();
const confirmed = await sp.getByText(/submitted/i).first().waitFor({ state: "visible", timeout: 12000 }).then(() => true).catch(() => false);
ok(confirmed, "student submission confirmed");

// teacher sees results (polls every 3s)
await tp.waitForTimeout(5000);
ok((await tp.content()).includes("1 responded"), "lecturer sees live results (1 responded)");

await tp.screenshot({ path: "/tmp/oc-shots/quiz-teacher.png" });
await sp.screenshot({ path: "/tmp/oc-shots/quiz-student.png" });
await browser.close();
console.log(fails === 0 ? "\nQUIZ OK" : `\n${fails} FAILED`);
process.exit(fails ? 1 : 0);
