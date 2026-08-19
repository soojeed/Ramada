import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireModule } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const invoicesRouter = Router();
invoicesRouter.use(requireAuth, requireModule("Invoices"));

const invoiceInclude = { guest: true, booking: { include: { room: true } } } as const;

invoicesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const invoices = await prisma.invoice.findMany({
      include: invoiceInclude,
      orderBy: { invoiceId: "desc" },
    });
    res.json({ success: true, data: invoices });
  })
);

invoicesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceId: Number(req.params.id) },
      include: invoiceInclude,
    });
    if (!invoice) throw ApiError.notFound("Invoice lama helin.");
    res.json({ success: true, data: invoice });
  })
);

// Generate an invoice from an existing booking — pulls the room charge
// from the booking and sums any food orders tied to it.
invoicesRouter.post(
  "/from-booking/:bookingId",
  asyncHandler(async (req, res) => {
    const bookingId = Number(req.params.bookingId);
    const booking = await prisma.booking.findUnique({
      where: { bookingId },
      include: { guest: true, foodOrders: true },
    });
    if (!booking) throw ApiError.notFound("Booking lama helin.");

    const totalRoomCharge = Number(booking.finalAmount);
    const totalFoodCharge = booking.foodOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
    const grandTotal = totalRoomCharge + totalFoodCharge;

    const invoice = await prisma.invoice.create({
      data: {
        bookingId: booking.bookingId,
        guestId: booking.guestId,
        totalRoomCharge,
        totalFoodCharge,
        grandTotal,
        invoiceDate: new Date(),
        isPaid: false,
      },
      include: invoiceInclude,
    });

    res.status(201).json({ success: true, data: invoice });
  })
);

const walkInSchema = z.object({
  walkInCustomerName: z.string().min(1),
  totalRoomCharge: z.coerce.number().nonnegative().default(0),
  totalFoodCharge: z.coerce.number().nonnegative().default(0),
});

invoicesRouter.post(
  "/walk-in",
  validateBody(walkInSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof walkInSchema>;
    const grandTotal = body.totalRoomCharge + body.totalFoodCharge;

    const invoice = await prisma.invoice.create({
      data: {
        walkInCustomerName: body.walkInCustomerName,
        totalRoomCharge: body.totalRoomCharge,
        totalFoodCharge: body.totalFoodCharge,
        grandTotal,
        invoiceDate: new Date(),
        isPaid: true,
      },
    });

    res.status(201).json({ success: true, data: invoice });
  })
);

invoicesRouter.post(
  "/:id/mark-paid",
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.update({
      where: { invoiceId: Number(req.params.id) },
      data: { isPaid: true },
      include: invoiceInclude,
    });
    res.json({ success: true, data: invoice });
  })
);

invoicesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.invoice.delete({ where: { invoiceId: Number(req.params.id) } });
    res.json({ success: true, message: "Invoice si guul leh ayaa loo tirtiray." });
  })
);
