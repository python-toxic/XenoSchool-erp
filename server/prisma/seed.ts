import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await argon2.hash("admin123");

    // Create Admin
    const adminUser = await prisma.user.upsert({
        where: { email: "admin@school.com" },
        update: { passwordHash },
        create: {
            email: "admin@school.com",
            passwordHash,
            firstName: "Super",
            lastName: "Admin",
        },
    });
    await prisma.userRole.upsert({
        where: { userId_role: { userId: adminUser.id, role: "super_admin" } },
        update: {},
        create: { userId: adminUser.id, role: "super_admin" },
    });

    // Create Teacher
    const teacherPass = await argon2.hash("teacher123");
    const teacherUser = await prisma.user.upsert({
        where: { email: "teacher@school.com" },
        update: { passwordHash: teacherPass },
        create: {
            email: "teacher@school.com",
            passwordHash: teacherPass,
            firstName: "Rahul",
            lastName: "Sharma",
        },
    });
    await prisma.userRole.upsert({
        where: { userId_role: { userId: teacherUser.id, role: "teacher" } },
        update: {},
        create: { userId: teacherUser.id, role: "teacher" },
    });
    await prisma.teacher.upsert({
        where: { employeeId: "TCH001" },
        update: { userId: teacherUser.id },
        create: {
            employeeId: "TCH001",
            firstName: "Rahul",
            lastName: "Sharma",
            department: "Mathematics",
            userId: teacherUser.id,
        }
    });

    // Create a Class and Section for the Student
    const class10 = await prisma.class.upsert({
        where: { id: "class-10-id" },
        update: {},
        create: {
            id: "class-10-id",
            name: "Class 10",
            grade: 10,
            academicYear: "2024-25",
        }
    });

    const sectionA = await prisma.section.upsert({
        where: { id: "section-a-id" },
        update: {},
        create: {
            id: "section-a-id",
            name: "A",
            capacity: 30,
            classId: class10.id,
        }
    });

    // Create Student
    const studentPass = await argon2.hash("student123");
    const studentUser = await prisma.user.upsert({
        where: { email: "student@school.com" },
        update: { passwordHash: studentPass },
        create: {
            email: "student@school.com",
            passwordHash: studentPass,
            firstName: "Sanya",
            lastName: "Gupta",
        },
    });
    await prisma.userRole.upsert({
        where: { userId_role: { userId: studentUser.id, role: "student" } },
        update: {},
        create: { userId: studentUser.id, role: "student" },
    });
    await prisma.student.upsert({
        where: { admissionNumber: "ADM001" },
        update: { userId: studentUser.id },
        create: {
            admissionNumber: "ADM001",
            firstName: "Sanya",
            lastName: "Gupta",
            dateOfBirth: new Date("2008-05-15"),
            gender: "female",
            classId: class10.id,
            sectionId: sectionA.id,
            userId: studentUser.id,
        }
    });

    console.log("Seed complete: Admin, Teacher and Student users created/verified");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
