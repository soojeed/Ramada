import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireModule } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const reportsRouter = Router();
reportsRouter.use(requireAuth, requireModule("Reports"));

function parseRange(req: import("express").Request) {
  const { from, to } = req.query as { from?: string; to?: string };
  const gte = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
  const lte = to ? new Date(to) : new Date();
  return { gte, lte };
}

reportsRouter.get(
  "/revenue",
  asyncHandler(async (req, res) => {
    const { gte, lte } = parseRange(req);
    const finances = await prisma.finance.findMany({
      where: { transactionDate: { gte, lte } },
      orderBy: { transactionDate: "asc" },
    });

    const totalIncome = finances.reduce((sum, f) => sum + Number(f.income), 0);
    const totalExpense = finances.reduce((sum, f) => sum + Number(f.expense), 0);

    const byCategory = new Map<string, { income: number; expense: number }>();
    for (const f of finances) {
      const key = f.category ?? "Other";
      const cur = byCategory.get(key) ?? { income: 0, expense: 0 };
      cur.income += Number(f.income);
      cur.expense += Number(f.expense);
      byCategory.set(key, cur);
    }

    res.json({
      success: true,
      data: {
        range: { from: gte, to: lte },
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        byCategory: Array.from(byCategory.entries()).map(([category, v]) => ({ category, ...v })),
      },
    });
  })
);

reportsRouter.get(
  "/occupancy",
  asyncHandler(async (_req, res) => {
    const rooms = await prisma.room.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const total = rooms.reduce((sum, r) => sum + r._count._all, 0);

    res.json({
      success: true,
      data: rooms.map((r) => ({
        status: r.status,
        count: r._count._all,
        percent: total ? Math.round((r._count._all / total) * 1000) / 10 : 0,
      })),
    });
  })
);

reportsRouter.get(
  "/bookings",
  asyncHandler(async (req, res) => {
    const { gte, lte } = parseRange(req);
    const bookings = await prisma.booking.findMany({
      where: { checkInDate: { gte, lte } },
      include: { guest: true, room: { include: { roomType: true } } },
      orderBy: { checkInDate: "desc" },
    });

    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.finalAmount), 0);

    res.json({ success: true, data: { count: bookings.length, totalRevenue, bookings } });
  })
);

reportsRouter.get(
  "/staff-payroll",
  asyncHandler(async (req, res) => {
    const { gte, lte } = parseRange(req);
    const advances = await prisma.salaryAdvance.findMany({
      where: { paymentDate: { gte, lte } },
      include: { staff: true },
      orderBy: { paymentDate: "desc" },
    });

    const totalAdvance = advances
      .filter((a) => a.paymentType === "Advance")
      .reduce((sum, a) => sum + Number(a.amount), 0);
    const totalSalaryPaid = advances
      .filter((a) => a.paymentType === "Salary")
      .reduce((sum, a) => sum + Number(a.amount), 0);

    res.json({ success: true, data: { totalAdvance, totalSalaryPaid, records: advances } });
  })
);
