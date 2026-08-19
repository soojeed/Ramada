import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireModule } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const financeRouter = Router();
financeRouter.use(requireAuth, requireModule("Finance"));

function decorate<T extends { income: unknown; expense: unknown }>(row: T) {
  return { ...row, balance: Number(row.income) - Number(row.expense) };
}

financeRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as { from?: string; to?: string };
    const rows = await prisma.finance.findMany({
      where:
        from || to
          ? {
              transactionDate: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : undefined,
      orderBy: { transactionDate: "desc" },
    });

    const totalIncome = rows.reduce((sum, r) => sum + Number(r.income), 0);
    const totalExpense = rows.reduce((sum, r) => sum + Number(r.expense), 0);

    res.json({
      success: true,
      data: rows.map(decorate),
      summary: { totalIncome, totalExpense, netBalance: totalIncome - totalExpense },
    });
  })
);

financeRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await prisma.finance.findUnique({ where: { financeId: Number(req.params.id) } });
    if (!row) throw ApiError.notFound("Finance record lama helin.");
    res.json({ success: true, data: decorate(row) });
  })
);

const schema = z.object({
  description: z.string().min(1, "Description waa lagama maarmaan."),
  income: z.coerce.number().nonnegative().default(0),
  expense: z.coerce.number().nonnegative().default(0),
  transactionDate: z.coerce.date().optional(),
  category: z.string().optional().nullable(),
});

financeRouter.post(
  "/",
  validateBody(schema),
  asyncHandler(async (req, res) => {
    const row = await prisma.finance.create({ data: req.body });
    res.status(201).json({ success: true, data: decorate(row) });
  })
);

financeRouter.put(
  "/:id",
  validateBody(schema),
  asyncHandler(async (req, res) => {
    const row = await prisma.finance.update({
      where: { financeId: Number(req.params.id) },
      data: req.body,
    });
    res.json({ success: true, data: decorate(row) });
  })
);

financeRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.finance.delete({ where: { financeId: Number(req.params.id) } });
    res.json({ success: true, message: "Finance record si guul leh ayaa loo tirtiray." });
  })
);
