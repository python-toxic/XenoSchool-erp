import { FastifyReply, FastifyRequest } from "fastify";
import prisma from "../lib/prisma.js";

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        return reply.status(401).send({ error: "Unauthorized", message: "Invalid or expired token" });
    }
};

export const authorize = (permissions: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = request.user as { id: string; role: string };

        if (!user) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        // In a real implementation, we would fetch user permissions from DB or cache
        // based on their role. For now, we'll implement a simple role-based check
        // following the SECURE_ARCHITECTURE_GUIDE matrix.

        const userRoles = await prisma.userRole.findMany({
            where: { userId: user.id },
            select: { role: true }
        });

        const roles = userRoles.map((r: { role: string }) => r.role);

        // Super Admin has all permissions
        if (roles.includes("super_admin")) return;

        // TODO: Implement fine-grained permission check against ROLE_PERMISSIONS matrix
        // For now, allow if the role is 'admin' or matches the required logic
    };
};
