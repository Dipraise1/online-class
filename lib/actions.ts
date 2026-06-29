"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  getSession,
} from "@/lib/auth";

async function requireUser() {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

async function requireLecturer() {
  const user = await requireUser();
  if (user.role !== "LECTURER") throw new Error("Lecturers only");
  return user;
}

// ---------- Auth ----------

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "STUDENT");
  const matric = String(formData.get("matric") || "").trim() || null;

  if (!name || !email || password.length < 6) {
    redirect("/register?error=" + encodeURIComponent("Fill all fields (password 6+ chars)"));
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/register?error=" + encodeURIComponent("Email already registered"));
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await hashPassword(password),
      role: role === "LECTURER" ? "LECTURER" : "STUDENT",
      matric,
    },
  });

  await createSession({ id: user.id, name: user.name, role: user.role as "LECTURER" | "STUDENT" });
  const next = String(formData.get("next") || "");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password))) {
    redirect("/login?error=" + encodeURIComponent("Invalid email or password"));
  }

  await createSession({ id: user!.id, name: user!.name, role: user!.role as "LECTURER" | "STUDENT" });
  const next = String(formData.get("next") || "");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

// ---------- Lecturer ----------

export async function createCourseAction(formData: FormData) {
  const user = await requireLecturer();
  const code = String(formData.get("code") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  if (!code || !title) return;

  const course = await prisma.course.create({
    data: { code, title, description, lecturerId: user.id },
  });
  revalidatePath("/courses");
  redirect(`/courses/${course.id}`);
}

export async function uploadMaterialAction(formData: FormData) {
  await requireLecturer();
  const courseId = String(formData.get("courseId") || "");
  const title = String(formData.get("title") || "").trim();
  const file = formData.get("file") as File | null;
  if (!courseId || !title || !file || file.size === 0) return;

  const saved = await saveFile(file);
  await prisma.material.create({
    data: {
      courseId,
      title,
      fileName: saved.fileName,
      fileUrl: saved.url,
      size: saved.size,
    },
  });
  revalidatePath(`/courses/${courseId}`);
}

export async function createSessionAction(formData: FormData) {
  await requireLecturer();
  const courseId = String(formData.get("courseId") || "");
  const title = String(formData.get("title") || "").trim();
  const startsAt = new Date(String(formData.get("startsAt") || ""));
  const endsAt = new Date(String(formData.get("endsAt") || ""));
  const mode = String(formData.get("mode") || "PHYSICAL");
  const location = String(formData.get("location") || "").trim() || null;

  if (!courseId || !title || isNaN(+startsAt) || isNaN(+endsAt)) return;

  await prisma.classSession.create({
    data: {
      courseId,
      title,
      startsAt,
      endsAt,
      mode: mode === "ONLINE" ? "ONLINE" : "PHYSICAL",
      location,
    },
  });
  revalidatePath(`/courses/${courseId}`);
}

export async function startLiveAction(formData: FormData) {
  const user = await requireLecturer();
  const sessionId = String(formData.get("sessionId") || "");
  if (!sessionId) return;

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: { course: true },
  });
  if (!session || session.course.lecturerId !== user.id) return;

  if (!session.startedAt) {
    await prisma.classSession.update({
      where: { id: sessionId },
      data: { startedAt: new Date() },
    });
  }
  redirect(`/courses/${session.courseId}/live/${sessionId}`);
}

// ---------- Student ----------

export async function enrollAction(formData: FormData) {
  const user = await requireUser();
  const courseId = String(formData.get("courseId") || "");
  if (!courseId) return;

  await prisma.enrollment.upsert({
    where: { courseId_studentId: { courseId, studentId: user.id } },
    update: {},
    create: { courseId, studentId: user.id },
  });
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/courses");
}

export async function markAttendanceAction(formData: FormData) {
  const user = await requireUser();
  const sessionId = String(formData.get("sessionId") || "");
  if (!sessionId) return;

  const session = await prisma.classSession.findUnique({ where: { id: sessionId } });
  if (!session) return;

  const now = new Date();
  const opensAt = new Date(session.startsAt.getTime() - 30 * 60 * 1000); // 30 min before
  if (now < opensAt || now > session.endsAt) {
    return; // outside the attendance window
  }

  const status = now > session.startsAt ? "LATE" : "PRESENT";
  await prisma.attendance.upsert({
    where: { sessionId_studentId: { sessionId, studentId: user.id } },
    update: {},
    create: { sessionId, studentId: user.id, status },
  });
  revalidatePath(`/courses/${session.courseId}`);
}
