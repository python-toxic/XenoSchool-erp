import { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import multipart from "@fastify/multipart";
import { storageService } from "../lib/storage.js";

// Helper: coerce empty string from multipart forms → null
const optStr = () => z.string().transform(v => v === "" ? null : v).nullable().optional();
const optEmail = () => z.string().transform(v => v === "" ? null : v).nullable().optional()
    .refine(v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid email address");
const optPhone10 = (msg: string) => z.string().transform(v => v === "" ? null : v).nullable().optional()
    .refine(v => !v || /^\d{10}$/.test(v), msg);

const studentSchema = z.object({
    admissionNumber: z.string().optional(),
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: z.string().transform(v => new Date(v)),
    gender: z.string(),
    email: optEmail(),
    phone: optPhone10("Mobile number must be exactly 10 digits"),
    address: optStr(),
    classId: z.string().uuid(),
    sectionId: z.string().uuid(),
    parentId: z.string().uuid().optional().nullable(),
    fatherName: optStr(),
    motherName: optStr(),
    emergencyPhone: optPhone10("Emergency contact must be exactly 10 digits"),
    previousSchool: optStr(),
    medicalInfo: optStr(),
    otherInfo: optStr(),
});

export default async function studentRoutes(app: FastifyInstance) {
    app.register(multipart, {
        limits: {
            fieldNameSize: 100, // Max field name size in bytes
            fieldSize: 1048576, // 1MB - Increased from 100b to handle larger text fields (address, info)
            fields: 20,         // Max number of non-file fields
            fileSize: 5242880,  // For multiparts, the limit in bytes (5MB)
            files: 5,           // Max number of file fields
        }
    });

    app.addHook("preHandler", authenticate);

    // ─── List Students ──────────────────────────────────────────
    app.get("/", { preHandler: [authorize(["students:view"])] }, async (request, reply) => {
        const { page = 1, limit = 20, search = "" } = request.query as any;
        const skip = (page - 1) * limit;

        const where = search ? {
            OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
                { admissionNumber: { contains: search, mode: "insensitive" as const } },
            ]
        } : {};

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                include: { class: true, section: true },
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
            }),
            prisma.student.count({ where }),
        ]);

        return {
            data: students,
            meta: { page: Number(page), limit: Number(limit), total },
        };
    });

    // ─── Get Student ────────────────────────────────────────────
    app.get("/:id", { preHandler: [authorize(["students:view"])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const student = await prisma.student.findUnique({
            where: { id },
            include: { class: true, section: true, parent: true },
        });

        if (!student) return reply.status(404).send({ error: "Student not found" });
        return { data: student };
    });

    // ─── Create Student (Admission) ─────────────────────────────
    app.post("/", { preHandler: [authorize(["students:create"])] }, async (request, reply) => {
        // Since we are using multipart, we need to parse the parts manually or use request.file()/request.files()
        // For simplicity in this implementation, we'll use request.parts()

        const parts = (request as any).parts();
        const body: any = {};
        const files: { buffer: Buffer, filename: string, fieldname: string }[] = [];

        for await (const part of parts) {
            if (part.type === 'file') {
                const buffer = await part.toBuffer();
                files.push({ buffer, filename: part.filename, fieldname: part.fieldname });
            } else {
                body[part.fieldname] = part.value;
            }
        }

        const data = studentSchema.parse(body);
        const { classId, sectionId, parentId, ...scalarData } = data;

        // Auto-generate admission number if not provided
        const year = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        const admissionNumber = scalarData.admissionNumber || `ADM-${year}-${rand}`;

        // Handle student creation and document storage in a transaction
        const student = await prisma.$transaction(async (tx) => {
            const newStudent = await tx.student.create({
                data: {
                    ...scalarData,
                    admissionNumber,
                    class: { connect: { id: classId } },
                    section: { connect: { id: sectionId } },
                    ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
                } as any
            });

            // Upload files and create document records
            for (const file of files) {
                const url = await storageService.uploadFile(file.buffer, file.filename, `students/${newStudent.id}`);
                await (tx as any).studentDocument.create({
                    data: {
                        studentId: newStudent.id,
                        type: file.fieldname,
                        name: file.filename,
                        url: url,
                    }
                });
            }

            return newStudent;
        });

        return reply.status(201).send({ data: student });
    });

    // ─── Update Student ─────────────────────────────────────────
    app.put("/:id", { preHandler: [authorize(["students:edit"])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const rawData = studentSchema.partial().parse(request.body);
        const { classId, sectionId, parentId, ...scalarData } = rawData;
        const student = await prisma.student.update({
            where: { id },
            data: {
                ...scalarData,
                ...(classId ? { class: { connect: { id: classId } } } : {}),
                ...(sectionId ? { section: { connect: { id: sectionId } } } : {}),
                ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
            } as any,
        });
        return { data: student };
    });

    // ─── Delete Student ─────────────────────────────────────────
    app.delete("/:id", { preHandler: [authorize(["students:delete"])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        await prisma.student.delete({ where: { id } });
        return reply.status(204).send();
    });
}
