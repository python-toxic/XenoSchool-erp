import { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const classSchema = z.object({
    name: z.string(),
    grade: z.number().int().min(1).max(12),
    academicYear: z.string(),
});

const sectionSchema = z.object({
    name: z.string(),
    capacity: z.number().int().min(1),
    classId: z.string().uuid(),
    classTeacherId: z.string().uuid().optional().nullable(),
});

export default async function classRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authenticate);

    // ─── List Classes ───────────────────────────────────────────
    app.get("/", { preHandler: [authorize(["classes:view"])] }, async () => {
        const classes = await prisma.class.findMany({
            include: {
                sections: {
                    include: {
                        _count: {
                            select: { students: true }
                        },
                        classTeacher: true
                    },
                    orderBy: { name: "asc" }
                },
                _count: {
                    select: { students: true }
                }
            },
            orderBy: [{ grade: "asc" }, { name: "asc" }]
        });
        return { data: classes };
    });

    // ─── Get Single Class ───────────────────────────────────────
    app.get("/:id", { preHandler: [authorize(["classes:view"])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const schoolClass = await prisma.class.findUnique({
            where: { id },
            include: {
                sections: {
                    include: {
                        _count: {
                            select: { students: true }
                        },
                        classTeacher: true
                    },
                    orderBy: { name: "asc" }
                },
                _count: {
                    select: { students: true }
                }
            }
        });

        if (!schoolClass) return reply.status(404).send({ error: "Class not found" });
        return { data: schoolClass };
    });

    // ─── Create Class ──────────────────────────────────────────
    app.post("/", { preHandler: [authorize(["classes:create"])] }, async (request, reply) => {
        const data = classSchema.parse(request.body);
        const schoolClass = await prisma.class.create({ data });
        return reply.status(201).send({ data: schoolClass });
    });

    // ─── Update Class ──────────────────────────────────────────
    app.put("/:id", { preHandler: [authorize(["classes:edit"])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const data = classSchema.partial().parse(request.body);
        const schoolClass = await prisma.class.update({
            where: { id },
            data
        });
        return { data: schoolClass };
    });

    // ─── Delete Class ──────────────────────────────────────────
    app.delete("/:id", { preHandler: [authorize(["classes:delete"])] }, async (request, reply) => {
        const { id } = request.params as { id: string };

        // Check if class has students
        const studentCount = await prisma.student.count({ where: { classId: id } });
        if (studentCount > 0) {
            return reply.status(400).send({ error: "Cannot delete class with existing students" });
        }

        await prisma.class.delete({ where: { id } });
        return reply.status(204).send();
    });

    // ─── Create Section ────────────────────────────────────────
    app.post("/sections", { preHandler: [authorize(["classes:create"])] }, async (request, reply) => {
        const data = sectionSchema.parse(request.body);
        const section = await prisma.section.create({ data });
        return reply.status(201).send({ data: section });
    });

    // ─── Update Section ────────────────────────────────────────
    app.put("/sections/:id", { preHandler: [authorize(["classes:edit"])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const data = sectionSchema.partial().parse(request.body);
        const section = await prisma.section.update({
            where: { id },
            data,
            include: { classTeacher: true }
        });
        return { data: section };
    });

    // ─── Delete Section ────────────────────────────────────────
    app.delete("/sections/:id", { preHandler: [authorize(["classes:delete"])] }, async (request, reply) => {
        const { id } = request.params as { id: string };

        // Check if section has students
        const studentCount = await prisma.student.count({ where: { sectionId: id } });
        if (studentCount > 0) {
            return reply.status(400).send({ error: "Cannot delete section with existing students" });
        }

        await prisma.section.delete({ where: { id } });
        return reply.status(204).send();
    });
}
