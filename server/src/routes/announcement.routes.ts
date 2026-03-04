import { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { Role } from "@prisma/client";

const announcementSchema = z.object({
    title: z.string(),
    content: z.string(),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    targetRoles: z.array(z.nativeEnum(Role)),
    isPublished: z.boolean().default(false),
});

export default async function announcementRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authenticate);

    app.get("/", { preHandler: [authorize(["announcements:view"])] }, async () => {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: "desc" },
        });
        return { data: announcements };
    });

    app.post("/", { preHandler: [authorize(["announcements:create"])] }, async (request, reply) => {
        const data = announcementSchema.parse(request.body);
        const announcement = await prisma.announcement.create({ data });
        return reply.status(201).send({ data: announcement });
    });

    app.put("/:id", { preHandler: [authorize(["announcements:edit"])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const data = announcementSchema.partial().parse(request.body);
        const announcement = await prisma.announcement.update({
            where: { id },
            data,
        });
        return { data: announcement };
    });

    app.delete("/:id", { preHandler: [authorize(["announcements:delete"])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        await prisma.announcement.delete({ where: { id } });
        return reply.status(204).send();
    });
}
