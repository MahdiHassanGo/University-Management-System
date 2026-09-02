import bcrypt from "bcryptjs";
import config from "../config/index.js";
import prisma from "../lib/prisma.js";

async function seed() {
  console.log("Seeding demo data...");
  const saltRounds = config.BCRYPT_SALT_ROUNDS || 12;

  // 1. Super Admin
  const adminEmail = "admin@university.edu";
  const adminPassword = await bcrypt.hash("Admin123!", saltRounds);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      provider: "CREDENTIALS",
      emailVerified: true,
    },
  });
  console.log("✔ Super Admin account verified/created.");

  // 2. Department
  const department = await prisma.department.upsert({
    where: { code: "CSE" },
    update: {},
    create: {
      code: "CSE",
      name: "Computer Science & Engineering",
      isActive: true,
    },
  });
  console.log("✔ CSE Department verified/created.");

  // 3. Program
  const program = await prisma.program.upsert({
    where: { code: "BSCSE" },
    update: {},
    create: {
      code: "BSCSE",
      name: "B.Sc. in Computer Science & Engineering",
      departmentId: department.id,
      degreeType: "BACHELORS",
      totalCredits: 140,
      maxSemesterCredits: 21,
      isActive: true,
    },
  });
  console.log("✔ BSCSE Program verified/created.");

  // 4. Instructor User & Profile
  const instructorEmail = "instructor@university.edu";
  const instructorPassword = await bcrypt.hash("Instructor123!", saltRounds);
  const instructorUser = await prisma.user.upsert({
    where: { email: instructorEmail },
    update: {},
    create: {
      email: instructorEmail,
      password: instructorPassword,
      role: "INSTRUCTOR",
      status: "ACTIVE",
      provider: "CREDENTIALS",
      emailVerified: true,
    },
  });

  await prisma.instructor.upsert({
    where: { userId: instructorUser.id },
    update: {},
    create: {
      employeeId: "INS2026001",
      userId: instructorUser.id,
      name: "Dr. Alan Turing",
      designation: "Professor",
      departmentId: department.id,
      academicStatus: "ACTIVE",
    },
  });
  console.log("✔ Demo Instructor profile verified/created.");

  // 5. Semester
  const semester = await prisma.academicSemester.upsert({
    where: {
      year_term: {
        year: 2026,
        term: "FALL",
      },
    },
    update: {},
    create: {
      year: 2026,
      term: "FALL",
      status: "REGISTRATION_OPEN",
      registrationStart: new Date("2026-09-01T00:00:00.000Z"),
      registrationEnd: new Date("2026-09-15T23:59:59.000Z"),
      classStart: new Date("2026-09-20T00:00:00.000Z"),
      classEnd: new Date("2026-12-20T23:59:59.000Z"),
    },
  });
  console.log("✔ Fall 2026 Academic Semester verified/created.");

  // 6. Student User & Profile
  const studentEmail = "student@university.edu";
  const studentPassword = await bcrypt.hash("Student123!", saltRounds);
  const studentUser = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {},
    create: {
      email: studentEmail,
      password: studentPassword,
      role: "STUDENT",
      status: "ACTIVE",
      provider: "CREDENTIALS",
      emailVerified: true,
    },
  });

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      studentId: "STU2026001",
      userId: studentUser.id,
      name: "John Doe",
      programId: program.id,
      admissionSemesterId: semester.id,
      academicStatus: "ACTIVE",
    },
  });
  console.log("✔ Demo Student profile verified/created.");

  console.log("Seeding completed successfully!");
}

seed()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
