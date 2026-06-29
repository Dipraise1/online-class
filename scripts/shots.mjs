import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:3000";
const dir = "/tmp/oc-shots";
const LC = process.env.LECTURER_COOKIE;
const SC = process.env.STUDENT_COOKIE;
const CID = process.env.CID;

const browser = await chromium.launch({ channel: "chrome" });
const ck = (v) => ({ name: "oc_session", value: v, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" });

async function shot(name, path, cookie, full = true) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 880 }, deviceScaleFactor: 2 });
  if (cookie) await ctx.addCookies([ck(cookie)]);
  const p = await ctx.newPage();
  await p.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  await p.screenshot({ path: `${dir}/${name}.png`, fullPage: full });
  await ctx.close();
  console.log("✓", name);
}

await shot("landing", "/", null);
await shot("register", "/register", null, false);
await shot("dashboard", "/dashboard", LC);
await shot("course-student", `/courses/${CID}`, SC);
await shot("courses-lecturer", "/courses", LC);

await browser.close();
console.log("done");
