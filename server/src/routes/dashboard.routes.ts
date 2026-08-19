import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const [
      totalRooms,
      occupiedRooms,
      totalGuests,
      activeBookings,
      pendingPayments,
      todaysBookings,
      finances,
    ] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: "Occupied" } }),
      prisma.guest.count(),
      prisma.booking.count({ where: { status: { not: "CheckedOut" } } }),
      prisma.payment.count({ where: { status: { in: ["Pending", "Partial"] } } }),
      prisma.booking.count({
        where: { checkInDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.finance.findMany(),
    ]);

    const totalIncome = finances.reduce((sum, f) => sum + Number(f.income), 0);
    const totalExpense = finances.reduce((sum, f) => sum + Number(f.expense), 0);

    res.json({
      success: true,
      data: {
        totalRooms,
        occupiedRooms,
        availableRooms: totalRooms - occupiedRooms,
        totalGuests,
        activeBookings,
        pendingPayments,
        todaysBookings,
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
      },
    });
  })
);
