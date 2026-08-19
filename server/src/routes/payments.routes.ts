import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireModule } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth, requireModule("Payments"));

const paymentInclude = {
  booking: { include: { guest: true } },
  order: true,
} as const;

function decorate<T extends { bookingId: number | null; walkInCustomerName: string | null; amount: unknown; amountPaid: unknown; booking?: { guest?: { fullName: string | null } | null } | null }>(
  p: T
) {
  const amount = Number(p.amount);
  const amountPaid = Number(p.amountPaid);
  return {
    ...p,
    balance: Math.max(amount - amountPaid, 0),
    isWalkIn: !p.bookingId,
    customerDisplayName: p.bookingId
      ? p.booking?.guest?.fullName ?? `Booking #${p.bookingId}`
      : p.walkInCustomerName?.trim() || "Walk-in Customer",
  };
}

paymentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const payments = await prisma.payment.findMany({
      where: status ? { status } : undefined,
      include: paymentInclude,
      orderBy: { paymentId: "desc" },
    });
    res.json({ success: true, data: payments.map(decorate) });
  })
);

paymentsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.findUnique({
      where: { paymentId: Number(req.params.id) },
      include: paymentInclude,
    });
    if (!payment) throw ApiError.notFound("Payment lama helin.");
    res.json({ success: true, data: decorate(payment) });
  })
);

const recordSchema = z.object({
  amountPaid: z.coerce.number().positive("Amount waa in uu ka weyn yahay 0."),
  paymentMethod: z.string().min(1, "Payment method waa lagama maarmaan."),
});

paymentsRouter.post(
  "/:id/record",
  validateBody(recordSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { amountPaid, paymentMethod } = req.body as z.infer<typeof recordSchema>;

    const payment = await prisma.payment.findUnique({ where: { paymentId: id } });
    if (!payment) throw ApiError.notFound("Payment lama helin.");

    const currentPaid = Number(payment.amountPaid);
    const amount = Number(payment.amount);
    const newPaid = Math.min(currentPaid + amountPaid, amount);
    const newStatus = newPaid >= amount ? "Paid" : newPaid > 0 ? "Partial" : "Pending";

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { paymentId: id },
        data: { amountPaid: newPaid, status: newStatus, paymentMethod },
        include: paymentInclude,
      });

      await tx.finance.create({
        data: {
          description: `Payment #${id} — ${payment.category ?? "Room/Food"}`,
          income: amountPaid,
          expense: 0,
          transactionDate: new Date(),
          category: payment.category ?? "Payment",
          paymentId: id,
        },
      });

      if (payment.bookingId && newStatus === "Paid") {
        await tx.invoice.updateMany({
          where: { bookingId: payment.bookingId },
          data: { isPaid: true },
        });
      }

      return updated;
    });

    res.json({ success: true, data: decorate(result) });
  })
);

paymentsRouter.post(
  "/:id/refund",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const payment = await prisma.payment.findUnique({ where: { paymentId: id } });
    if (!payment) throw ApiError.notFound("Payment lama helin.");

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { paymentId: id },
        data: { status: "Refunded" },
        include: paymentInclude,
      });
      await tx.finance.create({
        data: {
          description: `Refund — Payment #${id}`,
          income: 0,
          expense: Number(payment.amountPaid),
          transactionDate: new Date(),
          category: "Refund",
          paymentId: id,
        },
      });
      return updated;
    });

    res.json({ success: true, data: decorate(result) });
  })
);
