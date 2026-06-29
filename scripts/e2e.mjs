import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:3001";
const STUDENT = process.env.STUDENT_COOKIE;
const LECTURER = process.env.LECTURER_COOKIE;
const CID = process.env.CID;

function cookie(value) {
  return { name: "oc_session", value, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" };
}

const browser = await chromium.launch({ channel: "chrome" });
let failures = 0;
const check = (cond, msg) => { console.log(`${cond ? "✓" : "✗"} ${msg}`); if (!cond) failures++; };

// --- Student marks attendance ---
const sCtx = await browser.newContext();
await sCtx.addCookies([cookie(STUDENT)]);
const sp = await sCtx.newPage();
await sp.goto(`${BASE}/courses/${CID}`, { waitUntil: "networkidle" });

check(await sp.getByText("Mark attendance").first().isVisible(), "student sees 'Mark attendance' on open class");
await sp.getByRole("button", { name: "Mark attendance" }).first().click();
await sp.waitForLoadState("networkidle");
await sp.waitForTimeout(500);
const markedVisible = await sp.getByText(/Attendance marked/).first().isVisible().catch(() => false);
check(markedVisible, "after click, shows 'Attendance marked'");

// reload to confirm persistence
await sp.reload({ waitUntil: "networkidle" });
const stillMarked = await sp.getByText(/Attendance marked/).first().isVisible().catch(() => false);
check(stillMarked, "attendance persists after reload");

// --- Lecturer sees roster ---
const lCtx = await browser.newContext();
await lCtx.addCookies([cookie(LECTURER)]);
const lp = await lCtx.newPage();
await lp.goto(`${BASE}/courses/${CID}`, { waitUntil: "networkidle" });
const rosterHasDivine = await lp.getByText("Divine Evna Olong").first().isVisible().catch(() => false);
check(rosterHasDivine, "lecturer roster shows the student who marked");
const onePresent = (await lp.content()).includes("present");
check(onePresent, "lecturer sees attendance count");

await browser.close();
console.log(failures === 0 ? "\nALL PASSED" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
