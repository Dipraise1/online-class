import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(email, data, password) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name: data.name, role: data.role, matric: data.matric ?? null, password: hash },
    create: { email, password: hash, ...data },
  });
}

const teacher = await upsertUser("teacher@test.com", { name: "Test Teacher", role: "LECTURER" }, "test1234");
const student = await upsertUser("student@test.com", { name: "Test Student", role: "STUDENT", matric: "TEST/STU/001" }, "test1234");

let course = await prisma.course.findFirst({ where: { code: "CSC 101", lecturerId: teacher.id } });
if (!course) {
  course = await prisma.course.create({
    data: {
      code: "CSC 101",
      title: "Introduction to Programming",
      description: "A demo course for testing Online Class — live video, materials and attendance.",
      lecturerId: teacher.id,
    },
  });
}

await prisma.enrollment.upsert({
  where: { courseId_studentId: { courseId: course.id, studentId: student.id } },
  update: {},
  create: { courseId: course.id, studentId: student.id },
});

if ((await prisma.material.count({ where: { courseId: course.id } })) === 0) {
  await prisma.material.create({
    data: { courseId: course.id, title: "Lecture 1 — Getting Started (notes)", fileName: "lecture1-notes.txt", fileUrl: "/demo-notes.txt", size: 184000 },
  });
}

const now = Date.now();
const YEAR = 365 * 24 * 60 * 60 * 1000;
await prisma.classSession.deleteMany({ where: { courseId: course.id } });

// 1) Already live — student can jump straight into video
await prisma.classSession.create({
  data: {
    courseId: course.id,
    title: "Live Demo Class (join anytime)",
    startsAt: new Date(now - 10 * 60 * 1000),
    endsAt: new Date(now + YEAR),
    startedAt: new Date(now - 10 * 60 * 1000),
    mode: "ONLINE",
    location: "Online — live video room",
  },
});
// 2) Open but NOT started — shows the "waiting for lecturer" gate until teacher starts
await prisma.classSession.create({
  data: {
    courseId: course.id,
    title: "Today's Lecture (lecturer starts this)",
    startsAt: new Date(now - 5 * 60 * 1000),
    endsAt: new Date(now + 3 * 60 * 60 * 1000),
    startedAt: null,
    mode: "ONLINE",
    location: "Online — live video room",
  },
});
// 3) Upcoming — shows the "not started yet / scheduled" gate
await prisma.classSession.create({
  data: {
    courseId: course.id,
    title: "Week 2 — Variables & Types",
    startsAt: new Date(now + 2 * 24 * 60 * 60 * 1000),
    endsAt: new Date(now + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    mode: "PHYSICAL",
    location: "FoS Lecture Hall 1",
  },
});

console.log("Seeded test accounts:");
console.log("  Teacher → teacher@test.com / test1234");
console.log("  Student → student@test.com / test1234");
console.log("  Course  → " + course.code + " (" + course.id + ")");

await prisma.$disconnect();
