import "dotenv/config";
import Fastify, { FastifyError } from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import pino from "pino";
import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import classRoutes from "./routes/class.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import examRoutes from "./routes/exam.routes.js";
import feeRoutes from "./routes/fee.routes.js";
import announcementRoutes from "./routes/announcement.routes.js";
import { auditLogger } from "./middleware/audit.middleware.js";

// ─── Logger Configuration ──────────────────
const logger = pino({
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
        },
    },
});

const app = Fastify({
    logger: {
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
            },
        },
    },
    disableRequestLogging: true,
});

// ─── Security Middlewares ──────────────────
app.register(helmet, {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
        },
    },
});

app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
    ],
    credentials: true,
});

app.register(rateLimit, {
    max: 1000,
    timeWindow: "1 minute",
});

// ─── Auth Middlewares ──────────────────────
app.register(cookie, {
    secret: process.env.COOKIE_SECRET || "super-secret-cookie-key",
    hook: "onRequest",
});

app.register(jwt, {
    secret: process.env.JWT_SECRET || "super-secret-jwt-key",
    cookie: {
        cookieName: "access_token",
        signed: false,
    },
});

// ─── Health Check ──────────────────────────
app.get("/health", async () => {
    return { status: "OK", timestamp: new Date().toISOString() };
});

// ─── Register Modules ──────────────────────
app.register(authRoutes, { prefix: "/api/v1/auth" });
app.register(studentRoutes, { prefix: "/api/v1/students" });
app.register(classRoutes, { prefix: "/api/v1/classes" });
app.register(teacherRoutes, { prefix: "/api/v1/teachers" });
app.register(attendanceRoutes, { prefix: "/api/v1/attendance" });
app.register(examRoutes, { prefix: "/api/v1/exams" });
app.register(feeRoutes, { prefix: "/api/v1/fees" });
app.register(announcementRoutes, { prefix: "/api/v1/announcements" });

// ─── Register Hooks ────────────────────────
auditLogger(app);

// ─── Error Handler ─────────────────────────
app.setErrorHandler((error: FastifyError, _request, reply) => {
    app.log.error(error);

    if (error.validation || error.name === 'ZodError') {
        const details = (error as any).issues || error.validation;
        return reply.status(400).send({
            error: "Validation Error",
            message: error.message,
            details: details,
        });
    }

    if (error.statusCode === 429) {
        return reply.status(429).send({
            error: "Too Many Requests",
            message: "Rate limit exceeded, please try again later.",
        });
    }

    reply.status(error.statusCode || 500).send({
        data: null,
        meta: null,
        error: {
            code: error.code || "INTERNAL_SERVER_ERROR",
            message: process.env.NODE_ENV === "production"
                ? "An internal server error occurred"
                : error.message,
        },
    });
});

// ─── Start Server ───────────────────────────
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || "3000");
        await app.listen({ port, host: "0.0.0.0" });
        app.log.info(`Server listening on http://localhost:${port}`);
    } catch (err) {
        app.log.error(err as Error);
        process.exit(1);
    }
};

start();

export default app;
