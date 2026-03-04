import { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const statusEnum = z.enum(["present", "absent", "late", "excused"]);

const singleSchema = z.object({
    studentId: z.string().uuid(),
    date: z.string().transform(v => new Date(v)),
    status: statusEnum,
    markedBy: z.string(),
});

const bulkSchema = z.object({
    sectionId: z.string().uuid(),
    date: z.string(),
    markedBy: z.string(),
    records: z.array(z.object({
        studentId: z.string().uuid(),
        status: statusEnum,
    })),
});

export default async function attendanceRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authenticate);

    // ─── GET /attendance/class — roster for teacher ─────────────────────────────
    // Returns every student in a section with their attendance status for a given date (null if not yet marked)
    app.get("/class", { preHandler: [authorize(["attendance:view"])] }, async (request, reply) => {
        const { sectionId, date } = request.query as { sectionId?: string; date?: string };

        if (!sectionId || !date) {
            return reply.status(400).send({ error: "sectionId and date are required" });
        }

        const targetDate = new Date(date);
        // Normalise to midnight UTC
        targetDate.setUTCHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);

        const students = await prisma.student.findMany({
            where: { sectionId, isActive: true },
            orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
            select: {
                id: true,
                firstName: true,
                lastName: true,
                admissionNumber: true,
                gender: true,
                attendance: {
                    where: {
                        date: { gte: targetDate, lt: nextDay },
                    },
                    take: 1,
                },
            },
        });

        const data = students.map(s => ({
            studentId: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            admissionNumber: s.admissionNumber,
            gender: s.gender,
            record: s.attendance[0] ?? null,
        }));

        return { data };
    });

    // ─── POST /attendance/bulk — teacher marks full section ─────────────────────
    app.post("/bulk", { preHandler: [authorize(["attendance:mark"])] }, async (request, reply) => {
        const { sectionId, date, markedBy, records } = bulkSchema.parse(request.body);

        const targetDate = new Date(date);
        targetDate.setUTCHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);

        // Upsert each record: update if exists for that student+date, create otherwise
        const results = await Promise.all(
            records.map(r =>
                prisma.attendanceRecord.upsert({
                    where: {
                        // We need a unique constraint — use findFirst+delete+create pattern
                        // since schema has no unique on (studentId, date)
                        id: "00000000-0000-0000-0000-000000000000", // placeholder, overridden below
                    },
                    create: {} as any, // placeholder, handled below
                    update: {} as any,
                }).catch(() => null) // fallback to manual upsert below
            )
        );

        // Manual upsert since schema lacks unique(studentId, date)
        const upserted = await Promise.all(
            records.map(async r => {
                const existing = await prisma.attendanceRecord.findFirst({
                    where: {
                        studentId: r.studentId,
                        date: { gte: targetDate, lt: nextDay },
                    },
                });
                if (existing) {
                    return prisma.attendanceRecord.update({
                        where: { id: existing.id },
                        data: { status: r.status, markedBy },
                    });
                }
                return prisma.attendanceRecord.create({
                    data: {
                        studentId: r.studentId,
                        date: targetDate,
                        status: r.status,
                        markedBy,
                    },
                });
            })
        );

        return reply.status(201).send({ data: upserted, count: upserted.length });
    });

    // ─── PUT /attendance/:id — edit a single record ──────────────────────────────
    app.put("/:id", { preHandler: [authorize(["attendance:edit"])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { status } = z.object({ status: statusEnum }).parse(request.body);
        const record = await prisma.attendanceRecord.update({
            where: { id },
            data: { status },
        });
        return { data: record };
    });

    // ─── GET /attendance/summary — admin class-wise overview ─────────────────────
    app.get("/summary", { preHandler: [authorize(["attendance:view"])] }, async (request) => {
        const { from, to } = request.query as { from?: string; to?: string };

        const fromDate = from ? new Date(from) : (() => {
            const d = new Date(); d.setDate(1); d.setUTCHours(0, 0, 0, 0); return d;
        })();
        const toDate = to ? new Date(to) : new Date();

        const classes = await prisma.class.findMany({
            include: {
                sections: {
                    include: {
                        _count: { select: { students: true } },
                    },
                },
                _count: { select: { students: true } },
            },
            orderBy: [{ grade: "asc" }, { name: "asc" }],
        });

        // Get attendance counts per class
        const summaryData = await Promise.all(
            classes.map(async cls => {
                const studentIds = await prisma.student
                    .findMany({ where: { classId: cls.id }, select: { id: true } })
                    .then(ss => ss.map(s => s.id));

                if (studentIds.length === 0) {
                    return { classId: cls.id, className: cls.name, grade: cls.grade, totalStudents: 0, present: 0, absent: 0, late: 0, excused: 0, total: 0, percentage: 0 };
                }

                const records = await prisma.attendanceRecord.groupBy({
                    by: ["status"],
                    where: {
                        studentId: { in: studentIds },
                        date: { gte: fromDate, lte: toDate },
                    },
                    _count: { status: true },
                });

                const counts = { present: 0, absent: 0, late: 0, excused: 0 };
                records.forEach(r => { counts[r.status as keyof typeof counts] = r._count.status; });
                const total = Object.values(counts).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round(((counts.present + counts.late) / total) * 100) : 0;

                return {
                    classId: cls.id,
                    className: cls.name,
                    grade: cls.grade,
                    academicYear: cls.academicYear,
                    totalStudents: studentIds.length,
                    sectionCount: cls.sections.length,
                    ...counts,
                    total,
                    percentage,
                };
            })
        );

        return { data: summaryData, meta: { from: fromDate, to: toDate } };
    });

    // ─── GET /attendance/student/me — student's own history ──────────────────────
    app.get("/student/me", { preHandler: [authorize(["attendance:view"])] }, async (request, reply) => {
        const userId = (request.user as { id: string }).id;
        const { from, to } = request.query as { from?: string; to?: string };

        // Find student linked to this user
        const student = await prisma.student.findFirst({
            where: { userId },
            select: { id: true, firstName: true, lastName: true, admissionNumber: true, classId: true, sectionId: true },
        });

        if (!student) {
            return reply.status(404).send({ error: "Student profile not found for this user" });
        }

        const fromDate = from ? new Date(from) : (() => {
            const d = new Date(); d.setDate(1); d.setUTCHours(0, 0, 0, 0); return d;
        })();
        const toDate = to ? new Date(to) : new Date();

        const records = await prisma.attendanceRecord.findMany({
            where: {
                studentId: student.id,
                date: { gte: fromDate, lte: toDate },
            },
            orderBy: { date: "asc" },
        });

        const counts = { present: 0, absent: 0, late: 0, excused: 0 };
        records.forEach(r => { counts[r.status as keyof typeof counts]++; });
        const total = records.length;
        const percentage = total > 0 ? Math.round(((counts.present + counts.late) / total) * 100) : 0;

        return { data: { student, records, summary: { ...counts, total, percentage } } };
    });

    // ─── GET /attendance — basic list (legacy, kept for compatibility) ────────────
    app.get("/", { preHandler: [authorize(["attendance:view"])] }, async (request) => {
        const { studentId, date } = request.query as any;
        const where: any = {};
        if (studentId) where.studentId = studentId;
        if (date) where.date = new Date(date);

        const records = await prisma.attendanceRecord.findMany({
            where,
            include: { student: true },
            orderBy: { date: "desc" },
            take: 100,
        });
        return { data: records };
    });

    // ─── POST /attendance — single mark (legacy) ─────────────────────────────────
    app.post("/", { preHandler: [authorize(["attendance:mark"])] }, async (request, reply) => {
        const data = singleSchema.parse(request.body);
        const record = await prisma.attendanceRecord.create({ data });
        return reply.status(201).send({ data: record });
    });
}
