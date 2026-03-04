import { FastifyInstance, FastifyRequest } from "fastify";
import prisma from "../lib/prisma.js";

export const auditLogger = async (app: FastifyInstance) => {
    app.addHook("onResponse", async (request: FastifyRequest, reply) => {
        // Only log mutations (CREATE, UPDATE, DELETE)
        const mutations = ["POST", "PUT", "PATCH", "DELETE"];
        if (!mutations.includes(request.method)) return;

        // Skip health checks and logs themselves
        if (request.url.includes("/health") || request.url.includes("/audit-logs")) return;

        const user = request.user as { id: string } | undefined;

        try {
            await prisma.auditLog.create({
                data: {
                    userId: user?.id,
                    action: request.method,
                    resource: request.url.split("/")[2] || "unknown", // Simple resource extraction
                    resourceId: (request.params as any)?.id,
                    details: {
                        body: request.body as any,
                        statusCode: reply.statusCode,
                    },
                    ipAddress: request.ip,
                    userAgent: request.headers["user-agent"] || "unknown",
                },
            });
        } catch (err) {
            app.log.error(err as Error, "Failed to create audit log:");
        }
    });
};
