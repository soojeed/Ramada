import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireModule } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const bookingsRouter = Router();
bookingsRouter.use(requireAuth, requireModule("Bookings"));

const bookingInclude = {
  guest: true,
  room: { include: { roomType: true } },
  reservation: true,
} as const;

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  const nights = Math.round(ms / (1000 * 60 * 60 * 24));
  return nights;
}

bookingsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const bookings = await prisma.booking.findMany({
      include: bookingInclude,
      orderBy: { bookingId: "desc" },
    });
    res.json({ success: true, data: bookings });
  })
);

bookingsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUnique({
      where: { bookingId: Number(req.params.id) },
      include: bookingInclude,
    });
    if (!booking) throw ApiError.notFound("Booking lama helin.");
    res.json({ success: true, data: booking });
  })
);

const createSchema = z.object({
  guestId: z.coerce.number().int(),
  roomId: z.coerce.number().int(),
  reservationId: z.coerce.number().int().optional().nullable(),
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
  discountPercent: z.coerce.number().min(0).max(100).optional().default(0),
  status: z.string().optional().default("CheckedIn"),
});

bookingsRouter.post(
  "/",
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;

    if (body.checkOutDate <= body.checkInDate) {
      throw ApiError.badRequest("Check-out date waa in ay ka dambeysaa Check-in date.");
    }

    const room = await prisma.room.findUnique({
      where: { roomId: body.roomId },
      include: { roomType: true },
    });
    if (!room) throw ApiError.notFound("Room lama helin.");

    const nights = nightsBetween(body.checkInDate, body.checkOutDate);
    const totalAmount = nights * Number(room.roomType.pricePerNight);
    const discountAmount =
      body.discountPercent > 0 ? Math.round(totalAmount * (body.discountPercent / 100) * 100) / 100 : 0;
    const finalAmount = totalAmount - discountAmount;

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          guestId: body.guestId,
          roomId: body.roomId,
          reservationId: body.reservationId ?? null,
          checkInDate: body.checkInDate,
          checkOutDate: body.checkOutDate,
          totalAmount,
          discountPercent: body.discountPercent,
          discountAmount,
          finalAmount,
          status: body.status,
        },
        include: bookingInclude,
      });

      await tx.room.update({ where: { roomId: body.roomId }, data: { status: "Occupied" } });

      if (body.reservationId) {
        await tx.reservation.update({
          where: { reservationId: body.reservationId },
          data: { status: "Confirmed" },
        });
      }

      await tx.payment.create({
        data: {
          bookingId: booking.bookingId,
          roomCharge: finalAmount,
          foodCharge: 0,
          amount: finalAmount,
          paymentMethod: "Cash",
          paymentDate: new Date(),
          status: "Pending",
          amountPaid: 0,
          category: "Room",
        },
      });

      return booking;
    });

    res.status(201).json({ success: true, data: result });
  })
);

const updateSchema = createSchema.partial({ guestId: true, roomId: true, checkInDate: true, checkOutDate: true });

bookingsRouter.put(
  "/:id",
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const body = req.body as z.infer<typeof updateSchema>;

    const existing = await prisma.booking.findUnique({ where: { bookingId: id } });
    if (!existing) throw ApiError.notFound("Booking lama helin.");

    const checkInDate = body.checkInDate ?? existing.checkInDate;
    const checkOutDate = body.checkOutDate ?? existing.checkOutDate;
    const roomId = body.roomId ?? existing.roomId;

    if (checkOutDate <= checkInDate) {
      throw ApiError.badRequest("Check-out date waa in ay ka dambeysaa Check-in date.");
    }

    const room = await prisma.room.findUnique({ where: { roomId }, include: { roomType: true } });
    if (!room) throw ApiError.notFound("Room lama helin.");

    const nights = nightsBetween(checkInDate, checkOutDate);
    const totalAmount = nights * Number(room.roomType.pricePerNight);
    const discountPercent = body.discountPercent ?? Number(existing.discountPercent);
    const discountAmount =
      discountPercent > 0 ? Math.round(totalAmount * (discountPercent / 100) * 100) / 100 : 0;
    const finalAmount = totalAmount - discountAmount;

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { bookingId: id },
        data: {
          guestId: body.guestId ?? existing.guestId,
          roomId,
          checkInDate,
          checkOutDate,
          totalAmount,
          discountPercent,
          discountAmount,
          finalAmount,
          status: body.status ?? existing.status,
        },
        include: bookingInclude,
      });

      if (roomId !== existing.roomId) {
        await tx.room.update({ where: { roomId: existing.roomId }, data: { status: "Available" } });
        await tx.room.update({ where: { roomId }, data: { status: "Occupied" } });
      } else {
        await tx.room.update({ where: { roomId }, data: { status: "Occupied" } });
      }

      const existingPayment = await tx.payment.findFirst({
        where: { bookingId: id, category: "Room" },
      });
      if (existingPayment) {
        await tx.payment.update({
          where: { paymentId: existingPayment.paymentId },
          data: {
            roomCharge: finalAmount,
            amount: finalAmount + Number(existingPayment.foodCharge),
          },
        });
      }

      return booking;
    });

    res.json({ success: true, data: result });
  })
);

bookingsRouter.post(
  "/:id/checkout",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const booking = await prisma.booking.findUnique({ where: { bookingId: id } });
    if (!booking) throw ApiError.notFound("Booking lama helin.");

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { bookingId: id },
        data: { status: "CheckedOut" },
        include: bookingInclude,
      });
      await tx.room.update({ where: { roomId: booking.roomId }, data: { status: "Available" } });
      return updated;
    });

    res.json({ success: true, data: result });
  })
);

bookingsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const booking = await prisma.booking.findUnique({ where: { bookingId: id } });
    if (!booking) throw ApiError.notFound("Booking lama helin.");

    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { bookingId: id } });
      await tx.booking.delete({ where: { bookingId: id } });
      await tx.room.update({ where: { roomId: booking.roomId }, data: { status: "Available" } });
    });

    res.json({ success: true, message: "Booking si guul leh ayaa loo tirtiray." });
  })
);
