import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:3001";
const LECTURER = process.env.LECTURER_COOKIE;
const CID = process.env.CID;

const browser = await chromium.launch({ channel: "chrome" });
let failures = 0;
const check = (c, m) => { console.log(`${c ? "✓" : "✗"} ${m}`); if (!c) failures++; };

const ctx = await browser.newContext();
await ctx.addCookies([{ name: "oc_session", value: LECTURER, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
const p = await ctx.newPage();
await p.goto(`${BASE}/courses/${CID}`, { waitUntil: "networkidle" });

// Upload a document
await p.getByPlaceholder("Material title (e.g. Lecture 1 slides)").fill("Tutorial Notes Week 1");
await p.locator('input[type="file"]').setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello uniabuja") });
await p.getByRole("button", { name: "Upload document" }).click();
await p.waitForLoadState("networkidle");
await p.waitForTimeout(400);
check((await p.content()).includes("Tutorial Notes Week 1"), "uploaded material appears in list");

// Schedule a class
await p.getByPlaceholder("Class title (e.g. Week 1 — Intro)").fill("Week 3 — Trees");
await p.locator('input[name="startsAt"]').fill("2026-07-10T10:00");
await p.locator('input[name="endsAt"]').fill("2026-07-10T12:00");
await p.locator('input[name="location"]').fill("Hall 4");
await p.getByRole("button", { name: "Schedule class" }).click();
await p.waitForLoadState("networkidle");
await p.waitForTimeout(400);
check((await p.content()).includes("Week 3 — Trees"), "new scheduled class appears");

await browser.close();
console.log(failures === 0 ? "\nALL PASSED" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
