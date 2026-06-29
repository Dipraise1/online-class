import { chromium } from "playwright";

const BASE = process.env.BASE || "https://online-class-eosin.vercel.app";
const stamp = Date.now();
const email = `lect.${stamp}@uniabuja.edu.ng`;

const browser = await chromium.launch({ channel: "chrome" });
let failures = 0;
const check = (c, m) => { console.log(`${c ? "✓" : "✗"} ${m}`); if (!c) failures++; };

const ctx = await browser.newContext();
const p = await ctx.newPage();

await p.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });
await p.getByLabel("Full name").fill("Prod Lecturer");
await p.getByLabel("Email").fill(email);
await p.getByLabel("Password").fill("password123");
await p.locator('select[name="role"]').selectOption("LECTURER");
await Promise.all([
  p.waitForURL("**/dashboard", { timeout: 30000 }).catch(() => {}),
  p.getByRole("button", { name: "Create account" }).click(),
]);
check(p.url().includes("/dashboard"), `register → dashboard (at ${p.url().replace(BASE, "")})`);

// create a course
await p.goto(`${BASE}/courses`, { waitUntil: "domcontentloaded" });
await p.getByLabel("Course code").fill("CSC 101");
await p.getByLabel("Title").fill("Intro to Computing (prod)");
await p.getByRole("button", { name: "Create course" }).click();
await p.waitForLoadState("networkidle");
check((await p.content()).includes("Intro to Computing (prod)"), "course created + read back from Postgres");

await browser.close();
console.log(failures === 0 ? "\nLIVE OK" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
