import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

async function mint(user) {
  return new SignJWT({ id: user.id, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

async function upsertUser(email, data) {
  const password = await bcrypt.hash("password123", 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password, ...data },
  });
}

const lecturer = await upsertUser("lecturer@uniabuja.edu.ng", { name: "Dr. Amina Bello", role: "LECTURER" });
const student = await upsertUser("student@uniabuja.edu.ng", { name: "John Okafor", role: "STUDENT", matric: "24/0000CSC/001" });
const divine = await upsertUser("divine@uniabuja.edu.ng", { name: "Divine Evna Olong", role: "STUDENT", matric: "24/0000CSC/002" });

let course = await prisma.course.findFirst({ where: { code: "CSC 208", lecturerId: lecturer.id } });
if (!course) {
  course = await prisma.course.create({
    data: {
      code: "CSC 208",
      title: "Data Structures & Algorithms",
      description: "Core data structures, complexity analysis, and algorithm design.",
      lecturerId: lecturer.id,
    },
  });
}

for (const s of [student, divine]) {
  await prisma.enrollment.upsert({
    where: { courseId_studentId: { courseId: course.id, studentId: s.id } },
    update: {},
    create: { courseId: course.id, studentId: s.id },
  });
}

const matCount = await prisma.material.count({ where: { courseId: course.id } });
if (matCount === 0) {
  await prisma.material.create({
    data: { courseId: course.id, title: "Lecture 1 — Arrays & Lists (slides)", fileName: "lecture1.pdf", fileUrl: "/uploads/sample.txt", size: 248000 },
  });
}

// One class open right now, one upcoming
const now = Date.now();
await prisma.classSession.deleteMany({ where: { courseId: course.id } });
await prisma.classSession.create({
  data: {
    courseId: course.id,
    title: "Week 1 — Introduction (LIVE NOW)",
    startsAt: new Date(now - 10 * 60 * 1000),
    endsAt: new Date(now + 60 * 60 * 1000),
    mode: "PHYSICAL",
    location: "FoS Lecture Hall 2",
  },
});
await prisma.classSession.create({
  data: {
    courseId: course.id,
    title: "Week 2 — Stacks & Queues",
    startsAt: new Date(now + 2 * 24 * 60 * 60 * 1000),
    endsAt: new Date(now + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    mode: "ONLINE",
    location: "https://meet.example.com/csc208",
  },
});

console.log("COURSE_ID=" + course.id);
console.log("LECTURER_COOKIE=" + (await mint(lecturer)));
console.log("STUDENT_COOKIE=" + (await mint(divine)));

await prisma.$disconnect();
