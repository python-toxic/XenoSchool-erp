import { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const examSchema = z.object({
    name: z.string(),
    type: z.enum(["midterm", "final", "quiz", "assignment"]),
    subject: z.string(),
    date: z.string().transform(v => new Date(v)),
    totalMarks: z.number().int().positive(),
    passingMarks: z.number().int().positive(),
});

const gradeSchema = z.object({
    examId: z.string().uuid(),
    studentId: z.string().uuid(),
    marksObtained: z.number().min(0),
    grade: z.string(),
    gradedBy: z.string(),
});

export default async function examRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authenticate);

    // ─── Exams ──────────────────────────────────────────────────
    app.get("/", { preHandler: [authorize(["exams:view"])] }, async () => {
        const exams = await prisma.exam.findMany();
        return { data: exams };
    });

    app.post("/", { preHandler: [authorize(["exams:create"])] }, async (request, reply) => {
        const data = examSchema.parse(request.body);
        const exam = await prisma.exam.create({ data });
        return reply.status(201).send({ data: exam });
    });

    // ─── Grades ─────────────────────────────────────────────────
    app.get("/grades", { preHandler: [authorize(["exams:view"])] }, async (request) => {
        const { examId, studentId } = request.query as any;
        const where: any = {};
        if (examId) where.examId = examId;
        if (studentId) where.studentId = studentId;

        const grades = await prisma.grade.findMany({
            where,
            include: { exam: true, student: true },
        });
        return { data: grades };
    });

    app.post("/grades", { preHandler: [authorize(["exams:grade"])] }, async (request, reply) => {
        const data = gradeSchema.parse(request.body);
        const grade = await prisma.grade.create({ data });
        return reply.status(201).send({ data: grade });
    });
}
