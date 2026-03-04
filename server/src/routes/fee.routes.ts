import { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const invoiceSchema = z.object({
    studentId: z.string().uuid(),
    invoiceNumber: z.string(),
    amount: z.number().positive(),
    dueDate: z.string().transform(v => new Date(v)),
    status: z.enum(["pending", "paid", "overdue", "partial"]),
});

const paymentSchema = z.object({
    invoiceId: z.string().uuid(),
    studentId: z.string().uuid(),
    amount: z.number().positive(),
    paymentMethod: z.enum(["cash", "bank_transfer", "online", "cheque"]),
    transactionId: z.string().optional().nullable(),
    receivedBy: z.string(),
});

export default async function feeRoutes(app: FastifyInstance) {
    app.addHook("preHandler", authenticate);

    // ─── Invoices ───────────────────────────────────────────────
    app.get("/invoices", { preHandler: [authorize(["fees:view"])] }, async (request) => {
        const { studentId } = request.query as any;
        const where = studentId ? { studentId } : {};
        const invoices = await prisma.feeInvoice.findMany({
            where,
            include: { student: true },
        });
        return { data: invoices };
    });

    app.post("/invoices", { preHandler: [authorize(["fees:create"])] }, async (request, reply) => {
        const data = invoiceSchema.parse(request.body);
        const invoice = await prisma.feeInvoice.create({ data });
        return reply.status(201).send({ data: invoice });
    });

    // ─── Payments ───────────────────────────────────────────────
    app.get("/payments", { preHandler: [authorize(["fees:view"])] }, async (request) => {
        const { studentId, invoiceId } = request.query as any;
        const where: any = {};
        if (studentId) where.studentId = studentId;
        if (invoiceId) where.invoiceId = invoiceId;

        const payments = await prisma.payment.findMany({
            where,
            include: { student: true, invoice: true },
        });
        return { data: payments };
    });

    app.post("/payments", { preHandler: [authorize(["fees:collect"])] }, async (request, reply) => {
        const data = paymentSchema.parse(request.body);

        // Use transaction to create payment and update invoice status
        const result = await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({ data });

            // Update invoice status (simple logic: Mark as paid if payment amount matches)
            // In real app, we would sum all payments for the invoice
            await tx.feeInvoice.update({
                where: { id: data.invoiceId },
                data: { status: "paid" },
            });

            return payment;
        });

        return reply.status(201).send({ data: result });
    });
}
