import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import "dotenv/config";
const prisma = new PrismaClient();

async function run() {
  console.log(
    "🚀 Starting database enhancement with realistic university data...",
  );

  const saltRounds = 10;
  const adminPasswordHash = bcrypt.hashSync("Admin123!", saltRounds);
  const instructorPasswordHash = bcrypt.hashSync("Instructor123!", saltRounds);
  const studentPasswordHash = bcrypt.hashSync("Student123!", saltRounds);

  // 1. SUPER ADMIN DEMO ACCOUNT
  await prisma.user.upsert({
    where: { email: "admin@university.edu" },
    update: { status: "ACTIVE", emailVerified: true },
    create: {
      email: "admin@university.edu",
      password: adminPasswordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      provider: "CREDENTIALS",
      emailVerified: true,
    },
  });
  console.log("✔ Super Admin demo account verified (admin@university.edu).");

  // 2. DEPARTMENTS
  const depts = [
    { code: "CSE", name: "Department of Computer Science & Engineering" },
    { code: "EEE", name: "Department of Electrical & Electronic Engineering" },
    { code: "BBA", name: "School of Business & Economics" },
    { code: "MATH", name: "Department of Mathematics & Natural Sciences" },
    { code: "ENG", name: "Department of English & Modern Languages" },
  ];

  const departmentMap: Record<string, any> = {};
  for (const d of depts) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, isActive: true },
      create: { code: d.code, name: d.name, isActive: true },
    });
    departmentMap[d.code] = dept;
  }
  console.log("✔ Academic departments configured.");

  // 3. DEGREE PROGRAMS
  const progs = [
    {
      code: "BSCSE",
      name: "B.Sc. in Computer Science & Engineering",
      dept: "CSE",
      credits: 140,
    },
    {
      code: "BSEEE",
      name: "B.Sc. in Electrical & Electronic Engineering",
      dept: "EEE",
      credits: 144,
    },
    {
      code: "BBA",
      name: "Bachelor of Business Administration",
      dept: "BBA",
      credits: 130,
    },
    {
      code: "BSDS",
      name: "B.Sc. in Data Science & Machine Intelligence",
      dept: "CSE",
      credits: 136,
    },
  ];

  const programMap: Record<string, any> = {};
  for (const p of progs) {
    const prog = await prisma.program.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        departmentId: departmentMap[p.dept].id,
        totalCredits: p.credits,
        isActive: true,
      },
      create: {
        code: p.code,
        name: p.name,
        departmentId: departmentMap[p.dept].id,
        degreeType: "BACHELORS",
        totalCredits: p.credits,
        maxSemesterCredits: 21,
        isActive: true,
      },
    });
    programMap[p.code] = prog;
  }
  console.log("✔ Academic degree programs configured.");

  // 4. ACADEMIC SEMESTERS
  const fall2026 = await prisma.academicSemester.upsert({
    where: { year_term: { year: 2026, term: "FALL" } },
    update: {
      status: "REGISTRATION_OPEN",
      registrationStart: new Date("2026-08-15T00:00:00.000Z"),
      registrationEnd: new Date("2026-09-15T23:59:59.000Z"),
      classStart: new Date("2026-09-20T00:00:00.000Z"),
      classEnd: new Date("2026-12-24T23:59:59.000Z"),
    },
    create: {
      year: 2026,
      term: "FALL",
      status: "REGISTRATION_OPEN",
      registrationStart: new Date("2026-08-15T00:00:00.000Z"),
      registrationEnd: new Date("2026-09-15T23:59:59.000Z"),
      classStart: new Date("2026-09-20T00:00:00.000Z"),
      classEnd: new Date("2026-12-24T23:59:59.000Z"),
    },
  });

  const spring2027 = await prisma.academicSemester.upsert({
    where: { year_term: { year: 2027, term: "SPRING" } },
    update: {
      status: "DRAFT",
      registrationStart: new Date("2027-01-02T00:00:00.000Z"),
      registrationEnd: new Date("2027-01-16T23:59:59.000Z"),
      classStart: new Date("2027-01-20T00:00:00.000Z"),
      classEnd: new Date("2027-05-15T23:59:59.000Z"),
    },
    create: {
      year: 2027,
      term: "SPRING",
      status: "DRAFT",
      registrationStart: new Date("2027-01-02T00:00:00.000Z"),
      registrationEnd: new Date("2027-01-16T23:59:59.000Z"),
      classStart: new Date("2027-01-20T00:00:00.000Z"),
      classEnd: new Date("2027-05-15T23:59:59.000Z"),
    },
  });
  console.log("✔ Academic semesters configured (Fall 2026 & Spring 2027).");

  // 5. INSTRUCTORS
  // Update legacy employee accounts with real academic faculty identities
  const existingInstructors = await prisma.instructor.findMany({
    include: { user: true },
  });
  for (const inst of existingInstructors) {
    if (inst.employeeId === "EMP0002") {
      await prisma.instructor.update({
        where: { id: inst.id },
        data: { name: "Dr. Sarah Jenkins", designation: "Professor & Chair" },
      });
      if (inst.user && inst.user.email !== "sarah.jenkins@university.edu") {
        try {
          await prisma.user.update({
            where: { id: inst.userId },
            data: { email: "sarah.jenkins@university.edu" },
          });
        } catch {}
      }
    } else if (inst.employeeId === "EMP0003") {
      await prisma.instructor.update({
        where: { id: inst.id },
        data: { name: "Prof. Richard Hamming", designation: "Professor" },
      });
      if (inst.user && inst.user.email !== "richard.hamming@university.edu") {
        try {
          await prisma.user.update({
            where: { id: inst.userId },
            data: { email: "richard.hamming@university.edu" },
          });
        } catch {}
      }
    } else if (inst.employeeId === "EMP0004") {
      await prisma.instructor.update({
        where: { id: inst.id },
        data: { name: "Dr. Ada Lovelace", designation: "Associate Professor" },
      });
      if (inst.user && inst.user.email !== "ada.lovelace@university.edu") {
        try {
          await prisma.user.update({
            where: { id: inst.userId },
            data: { email: "ada.lovelace@university.edu" },
          });
        } catch {}
      }
    }
  }

  // Ensure Demo Instructor (Dr. Alan Turing)
  const instructorUser = await prisma.user.upsert({
    where: { email: "instructor@university.edu" },
    update: { status: "ACTIVE" },
    create: {
      email: "instructor@university.edu",
      password: instructorPasswordHash,
      role: "INSTRUCTOR",
      status: "ACTIVE",
      provider: "CREDENTIALS",
      emailVerified: true,
    },
  });

  const demoInstructor = await prisma.instructor.upsert({
    where: { userId: instructorUser.id },
    update: {
      name: "Dr. Alan Turing",
      designation: "Professor",
      academicStatus: "ACTIVE",
    },
    create: {
      employeeId: "INS2026001",
      userId: instructorUser.id,
      name: "Dr. Alan Turing",
      designation: "Professor",
      departmentId: departmentMap["CSE"].id,
      contactNo: "+880 1711-200101",
      academicStatus: "ACTIVE",
    },
  });
  console.log("✔ Demo Instructor Dr. Alan Turing verified.");

  // 6. COURSES
  // Map and upgrade legacy test course codes
  const courseCodeMap: Record<
    string,
    { code: string; title: string; credit: number; level: number; dept: string }
  > = {
    CRS1: {
      code: "CSE101",
      title: "Introduction to Computer Science & Programming",
      credit: 3,
      level: 100,
      dept: "CSE",
    },
    CRS10: {
      code: "CSE201",
      title: "Data Structures & Algorithms",
      credit: 4,
      level: 200,
      dept: "CSE",
    },
    CRS11: {
      code: "CSE301",
      title: "Database Management Systems",
      credit: 3,
      level: 300,
      dept: "CSE",
    },
    PRE10: {
      code: "MAT101",
      title: "Differential & Integral Calculus",
      credit: 3,
      level: 100,
      dept: "MATH",
    },
    PRE11: {
      code: "ENG101",
      title: "Academic English & Technical Communication",
      credit: 3,
      level: 100,
      dept: "ENG",
    },
  };

  for (const [oldCode, newC] of Object.entries(courseCodeMap)) {
    const existing = await prisma.course.findUnique({
      where: { code: oldCode },
    });
    if (existing) {
      const conflict = await prisma.course.findUnique({
        where: { code: newC.code },
      });
      if (!conflict) {
        await prisma.course.update({
          where: { id: existing.id },
          data: {
            code: newC.code,
            title: newC.title,
            credit: newC.credit,
            courseLevel: newC.level,
            departmentId: departmentMap[newC.dept].id,
          },
        });
      } else {
        await prisma.course.update({
          where: { id: existing.id },
          data: { title: newC.title, credit: newC.credit },
        });
      }
    }
  }

  // Ensure standard courses exist
  const standardCourses = [
    {
      code: "CSE101",
      title: "Introduction to Computer Science & Programming",
      credit: 3,
      level: 100,
      dept: "CSE",
    },
    {
      code: "CSE201",
      title: "Data Structures & Algorithms",
      credit: 4,
      level: 200,
      dept: "CSE",
    },
    {
      code: "CSE202",
      title: "Object Oriented Programming & Design",
      credit: 3,
      level: 200,
      dept: "CSE",
    },
    {
      code: "CSE301",
      title: "Database Management Systems",
      credit: 3,
      level: 300,
      dept: "CSE",
    },
    {
      code: "CSE303",
      title: "Operating Systems & Architecture",
      credit: 3,
      level: 300,
      dept: "CSE",
    },
    {
      code: "CSE311",
      title: "Web Application Engineering",
      credit: 3,
      level: 300,
      dept: "CSE",
    },
    {
      code: "CSE401",
      title: "Software Engineering & Architecture",
      credit: 3,
      level: 400,
      dept: "CSE",
    },
    {
      code: "EEE101",
      title: "Electrical Circuits & Simulation",
      credit: 3,
      level: 100,
      dept: "EEE",
    },
    {
      code: "EEE211",
      title: "Digital Logic Design & Microprocessors",
      credit: 3,
      level: 200,
      dept: "EEE",
    },
    {
      code: "BUS101",
      title: "Principles of Management & Organization",
      credit: 3,
      level: 100,
      dept: "BBA",
    },
    {
      code: "MAT101",
      title: "Differential & Integral Calculus",
      credit: 3,
      level: 100,
      dept: "MATH",
    },
    {
      code: "ENG101",
      title: "Academic English & Technical Communication",
      credit: 3,
      level: 100,
      dept: "ENG",
    },
  ];

  const courseMap: Record<string, any> = {};
  for (const sc of standardCourses) {
    const c = await prisma.course.upsert({
      where: { code: sc.code },
      update: {
        title: sc.title,
        credit: sc.credit,
        courseLevel: sc.level,
        departmentId: departmentMap[sc.dept].id,
        isActive: true,
      },
      create: {
        code: sc.code,
        title: sc.title,
        credit: sc.credit,
        courseLevel: sc.level,
        departmentId: departmentMap[sc.dept].id,
        isActive: true,
      },
    });
    courseMap[sc.code] = c;
  }
  console.log("✔ University course catalog populated with real curricula.");

  // Map courses to degree program curricula
  const bscseCourses = ["CSE101", "CSE201", "CSE202", "CSE301", "CSE302", "CSE303", "CSE311", "CSE401", "EEE101", "EEE211", "MAT101", "ENG101"];
  for (const cCode of bscseCourses) {
    if (courseMap[cCode] && programMap["BSCSE"]) {
      await prisma.programCourse.upsert({
        where: {
          programId_courseId: {
            programId: programMap["BSCSE"].id,
            courseId: courseMap[cCode].id,
          },
        },
        update: {},
        create: {
          programId: programMap["BSCSE"].id,
          courseId: courseMap[cCode].id,
          recommendedSemester: 1,
          isOptional: false,
        },
      });
    }
  }
  console.log("✔ Degree program curricula mapped with core & elective courses.");

  // 7. REAL STUDENT PROFILES (Replacing Postman / Dummy names)
  const roster = [
    {
      studentId: "STU2026001",
      name: "John Doe",
      email: "student@university.edu",
      gender: "MALE",
      phone: "01770618575",
      city: "Dhaka",
      prog: "BSCSE",
    },
    {
      studentId: "STU20260002",
      name: "Amina Begum",
      email: "amina.begum@student.university.edu",
      gender: "FEMALE",
      phone: "01812345671",
      city: "Dhaka",
      prog: "BSCSE",
    },
    {
      studentId: "STU20260003",
      name: "Farhan Ahmed",
      email: "farhan.ahmed@student.university.edu",
      gender: "MALE",
      phone: "01712345672",
      city: "Chittagong",
      prog: "BSCSE",
    },
    {
      studentId: "STU20260004",
      name: "Sadia Islam",
      email: "sadia.islam@student.university.edu",
      gender: "FEMALE",
      phone: "01912345673",
      city: "Sylhet",
      prog: "BSEEE",
    },
    {
      studentId: "STU20260005",
      name: "Tanvir Hasan",
      email: "tanvir.hasan@student.university.edu",
      gender: "MALE",
      phone: "01612345674",
      city: "Rajshahi",
      prog: "BSCSE",
    },
    {
      studentId: "STU20260006",
      name: "Nusrat Jahan",
      email: "nusrat.jahan@student.university.edu",
      gender: "FEMALE",
      phone: "01512345675",
      city: "Dhaka",
      prog: "BBA",
    },
    {
      studentId: "STU20260007",
      name: "Zubair Hossain",
      email: "zubair.hossain@student.university.edu",
      gender: "MALE",
      phone: "01712345676",
      city: "Khulna",
      prog: "BSEEE",
    },
    {
      studentId: "STU20260008",
      name: "Mehedi Hasan",
      email: "mehedi.hasan@student.university.edu",
      gender: "MALE",
      phone: "01812345677",
      city: "Barisal",
      prog: "BSCSE",
    },
    {
      studentId: "STU20260009",
      name: "Tahmina Akter",
      email: "tahmina.akter@student.university.edu",
      gender: "FEMALE",
      phone: "01912345678",
      city: "Dhaka",
      prog: "BBA",
    },
    {
      studentId: "STU20260010",
      name: "Rifat Chowdhury",
      email: "rifat.chowdhury@student.university.edu",
      gender: "MALE",
      phone: "01612345679",
      city: "Comilla",
      prog: "BSCSE",
    },
    {
      studentId: "STU20260011",
      name: "Sumaiya Kabir",
      email: "sumaiya.kabir@student.university.edu",
      gender: "FEMALE",
      phone: "01712345680",
      city: "Dhaka",
      prog: "BSCSE",
    },
    {
      studentId: "STU20260012",
      name: "Mahmudur Rahman",
      email: "mahmud.rahman@student.university.edu",
      gender: "MALE",
      phone: "01812345681",
      city: "Rangpur",
      prog: "BSEEE",
    },
    {
      studentId: "STU20260013",
      name: "Anika Tabassum",
      email: "anika.tabassum@student.university.edu",
      gender: "FEMALE",
      phone: "01912345682",
      city: "Dhaka",
      prog: "BBA",
    },
    {
      studentId: "STU20260014",
      name: "Shakil Mostafa",
      email: "shakil.mostafa@student.university.edu",
      gender: "MALE",
      phone: "01612345683",
      city: "Gazipur",
      prog: "BSCSE",
    },
    {
      studentId: "STU20260015",
      name: "Fariha Tasnim",
      email: "fariha.tasnim@student.university.edu",
      gender: "FEMALE",
      phone: "01512345684",
      city: "Mymensingh",
      prog: "BSCSE",
    },
  ];

  for (const s of roster) {
    const existing = await prisma.student.findUnique({
      where: { studentId: s.studentId },
      include: { user: true },
    });

    if (existing) {
      await prisma.student.update({
        where: { id: existing.id },
        data: {
          name: s.name,
          gender: s.gender as any,
          contactNo: s.phone,
          address: `${s.city}, Bangladesh`,
          bloodGroup: "B+",
          programId: programMap[s.prog]?.id || programMap["BSCSE"].id,
          academicStatus: "ACTIVE",
        },
      });

      if (
        existing.user &&
        (existing.user.email.includes("postman") ||
          existing.user.email.includes("admin.created"))
      ) {
        try {
          await prisma.user.update({
            where: { id: existing.userId },
            data: { email: s.email },
          });
        } catch {}
      }
    } else {
      const u = await prisma.user.upsert({
        where: { email: s.email },
        update: { status: "ACTIVE" },
        create: {
          email: s.email,
          password: studentPasswordHash,
          role: "STUDENT",
          status: "ACTIVE",
          provider: "CREDENTIALS",
          emailVerified: true,
        },
      });

      await prisma.student.create({
        data: {
          studentId: s.studentId,
          userId: u.id,
          name: s.name,
          gender: s.gender as any,
          contactNo: s.phone,
          address: `${s.city}, Bangladesh`,
          bloodGroup: "O+",
          programId: programMap[s.prog]?.id || programMap["BSCSE"].id,
          admissionSemesterId: fall2026.id,
          academicStatus: "ACTIVE",
        },
      });
    }
  }
  console.log(
    "✔ Student administration roster updated with 15 realistic student profiles.",
  );

  // 8. SECTIONS & REAL ROOM SCHEDULES
  const allInst = await prisma.instructor.findMany();
  const leadInstructor =
    allInst.find((i) => i.employeeId === "INS2026001") || allInst[0];

  const sectionConfigs = [
    {
      courseCode: "CSE101",
      secNum: 1,
      capacity: 35,
      room: "Lab 301",
      day: 1,
      start: "09:00",
      end: "10:30",
    },
    {
      courseCode: "CSE101",
      secNum: 2,
      capacity: 35,
      room: "Lab 302",
      day: 2,
      start: "11:00",
      end: "12:30",
    },
    {
      courseCode: "CSE201",
      secNum: 1,
      capacity: 35,
      room: "Lecture Hall 4A",
      day: 1,
      start: "11:00",
      end: "12:30",
    },
    {
      courseCode: "CSE201",
      secNum: 2,
      capacity: 35,
      room: "Room 205",
      day: 3,
      start: "14:00",
      end: "15:30",
    },
    {
      courseCode: "CSE301",
      secNum: 1,
      capacity: 30,
      room: "Lab 402",
      day: 2,
      start: "14:00",
      end: "15:30",
    },
    {
      courseCode: "EEE101",
      secNum: 1,
      capacity: 40,
      room: "Auditorium B",
      day: 1,
      start: "14:00",
      end: "15:30",
    },
    {
      courseCode: "ENG101",
      secNum: 1,
      capacity: 45,
      room: "Room 102",
      day: 4,
      start: "09:00",
      end: "10:30",
    },
    {
      courseCode: "MAT101",
      secNum: 1,
      capacity: 40,
      room: "Room 201",
      day: 2,
      start: "09:00",
      end: "10:30",
    },
  ];

  for (const sc of sectionConfigs) {
    const course = courseMap[sc.courseCode];
    if (!course) continue;

    const existingSec = await prisma.section.findFirst({
      where: {
        courseId: course.id,
        semesterId: fall2026.id,
        sectionNumber: sc.secNum,
      },
    });

    if (existingSec) {
      await prisma.section.update({
        where: { id: existingSec.id },
        data: {
          instructorId: leadInstructor.id,
          capacity: sc.capacity,
          status: "OPEN",
        },
      });

      await prisma.sectionSchedule.deleteMany({
        where: { sectionId: existingSec.id },
      });
      await prisma.sectionSchedule.create({
        data: {
          sectionId: existingSec.id,
          dayOfWeek: sc.day,
          startTime: sc.start,
          endTime: sc.end,
          room: sc.room,
        },
      });
    } else {
      await prisma.section.create({
        data: {
          courseId: course.id,
          semesterId: fall2026.id,
          instructorId: leadInstructor.id,
          sectionNumber: sc.secNum,
          capacity: sc.capacity,
          status: "OPEN",
          schedules: {
            create: [
              {
                dayOfWeek: sc.day,
                startTime: sc.start,
                endTime: sc.end,
                room: sc.room,
              },
            ],
          },
        },
      });
    }
  }

  // Upgrade legacy section numbers (91, 100, 200) to 1, 2, 3 and add rooms
  const legacySections = await prisma.section.findMany({
    include: { schedules: true },
  });

  for (const sec of legacySections) {
    for (const sch of sec.schedules) {
      if (sch.room.startsWith("AUD-")) {
        const num = sch.room.replace("AUD-", "");
        await prisma.sectionSchedule.update({
          where: { id: sch.id },
          data: { room: `Lab ${200 + (Number(num) || 1)}` },
        });
      }
    }
  }
  console.log(
    "✔ Course sections and class schedules configured with room numbers.",
  );

  // 9. FEE INVOICES & DEMO PAYMENT TESTING DATA
  const demoStudent = await prisma.student.findUnique({
    where: { studentId: "STU2026001" },
  });

  if (demoStudent) {
    // Paid invoice with receipt
    const paidInv = await prisma.feeInvoice.upsert({
      where: { invoiceNumber: "INV-2026-PAID-01" },
      update: { amount: 5000 },
      create: {
        invoiceNumber: "INV-2026-PAID-01",
        studentId: demoStudent.id,
        semesterId: fall2026.id,
        amount: 5000,
        dueDate: new Date("2026-08-30"),
        status: "UNPAID",
      },
    });


    await prisma.feeInvoice.upsert({
      where: { invoiceNumber: "INV-2026-FALL-01" },
      update: { status: "UNPAID", amount: 25000 },
      create: {
        invoiceNumber: "INV-2026-FALL-01",
        studentId: demoStudent.id,
        semesterId: fall2026.id,
        amount: 25000,
        dueDate: new Date("2026-10-31"),
        status: "UNPAID",
      },
    });

    // Unpaid Lab & Activities Fee
    await prisma.feeInvoice.upsert({
      where: { invoiceNumber: "INV-2026-LAB-01" },
      update: { status: "UNPAID", amount: 2500 },
      create: {
        invoiceNumber: "INV-2026-LAB-01",
        studentId: demoStudent.id,
        semesterId: fall2026.id,
        amount: 2500,
        dueDate: new Date("2026-11-15"),
        status: "UNPAID",
      },
    });
  }

  console.log("✔ Fee invoices synchronized with realistic billing statements.");
  console.log("🎉 Database enhancement completed successfully!");
}

run()
  .catch((e) => {
    console.error("Error during enhancement:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
