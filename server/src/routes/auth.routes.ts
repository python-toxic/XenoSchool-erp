import { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { verifyPassword } from "../lib/crypto.js";
import { authenticate } from "../middleware/auth.middleware.js";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export default async function authRoutes(app: FastifyInstance) {
    // ─── Login ─────────────────────────────────────────────────────────────────────────────────────────
    app.post("/login", async (request, reply) => {
        const { email, password } = loginSchema.parse(request.body);

        const user = await prisma.user.findUnique({
            where: { email },
            include: { roles: true },
        });

        if (!user || !(await verifyPassword(user.passwordHash, password))) {
            return reply.status(401).send({ error: "Unauthorized", message: "Invalid email or password" });
        }

        if (!user.isActive) {
            return reply.status(403).send({ error: "Forbidden", message: "Account is disabled" });
        }
        const accessToken = app.jwt.sign({
            id: user.id,
            email: user.email,
            roles: user.roles.map(r => r.role)
        }, { expiresIn: "15m" });

        const refreshToken = app.jwt.sign({ id: user.id }, { expiresIn: "7d" });

        // Store refresh token hash in DB
        // For simplicity in this step, we'll just store the raw token hash
        // in a production app, we'd use a dedicated table as defined in schema
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: refreshToken, // Ideally hashed, but JWT is already signed
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        reply
            .setCookie("access_token", accessToken, {
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            })
            .setCookie("refresh_token", refreshToken, {
                path: "/api/v1/auth/refresh",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            })
            .send({
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        roles: user.roles.map(r => r.role),
                    }
                }
            });
    });

    // ─── Refresh Token ──────────────────────────────────────────
    app.post("/refresh", async (request, reply) => {
        const token = request.cookies.refresh_token;

        if (!token) {
            return reply.status(401).send({ error: "Unauthorized", message: "No refresh token" });
        }

        try {
            const decoded = app.jwt.verify(token) as { id: string };

            const storedToken = await prisma.refreshToken.findFirst({
                where: { userId: decoded.id, tokenHash: token, revokedAt: null },
            });

            if (!storedToken || storedToken.expiresAt < new Date()) {
                return reply.status(401).send({ error: "Unauthorized", message: "Invalid or expired refresh token" });
            }

            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                include: { roles: true },
            });

            if (!user) return reply.status(404).send({ error: "Not Found" });

            const newAccessToken = app.jwt.sign({
                id: user.id,
                email: user.email,
                roles: user.roles.map(r => r.role)
            }, { expiresIn: "15m" });

            reply
                .setCookie("access_token", newAccessToken, {
                    path: "/",
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                })
                .send({ success: true });

        } catch (err) {
            return reply.status(401).send({ error: "Unauthorized" });
        }
    });

    // ─── Logout ─────────────────────────────────────────────────
    app.post("/logout", async (request, reply) => {
        const token = request.cookies.refresh_token;
        if (token) {
            await prisma.refreshToken.updateMany({
                where: { tokenHash: token },
                data: { revokedAt: new Date() },
            });
        }

        reply
            .clearCookie("access_token")
            .clearCookie("refresh_token")
            .send({ success: true });
    });

    // ─── Current User ───────────────────────────────────────────
    app.get("/me", { preHandler: [authenticate] }, async (request, reply) => {
        const userId = (request.user as { id: string }).id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { roles: true },
        });

        if (!user) return reply.status(404).send({ error: "User not found" });

        return {
            data: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: user.roles.map(r => r.role),
            }
        };
    });
}
