import { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const teacherSchema = z.object({
    employeeId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    department: z.string(),
    qualification: z.string().optional().nullable(),
    dateOfJoining: z.string().transform(v => new Date(v)).optional(),
});

export default async function teacherRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authenticate);

    app.get("/", { preHandler: [authorize(["teachers:view"])] }, async () => {
        const teachers = await prisma.teacher.findMany({
            include: { sections: true },
        });
        return { data: teachers };
    });

    app.post("/", { preHandler: [authorize(["teachers:create"])] }, async (request, reply) => {
        const data = teacherSchema.parse(request.body);
        const teacher = await prisma.teacher.create({ data });
        return reply.status(201).send({ data: teacher });
    });

    app.get("/:id", { preHandler: [authorize(["teachers:view"])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const teacher = await prisma.teacher.findUnique({
            where: { id },
            include: { sections: true },
        });
        if (!teacher) return reply.status(404).send({ error: "Teacher not found" });
        return { data: teacher };
    });

    app.put("/:id", { preHandler: [authorize(["teachers:edit"])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const data = teacherSchema.partial().parse(request.body);
        const teacher = await prisma.teacher.update({
            where: { id },
            data,
        });
        return { data: teacher };
    });

    app.delete("/:id", { preHandler: [authorize(["teachers:delete"])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        await prisma.teacher.delete({ where: { id } });
        return reply.status(204).send();
    });
}
