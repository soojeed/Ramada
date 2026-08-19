import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireModule } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const staffsRouter = Router();
staffsRouter.use(requireAuth, requireModule("Staffs"));

const schema = z.object({
  fullName: z.string().min(1, "Full name waa lagama maarmaan."),
  position: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  salary: z.coerce.number().nonnegative(),
  hireDate: z.coerce.date(),
});

staffsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const staffs = await prisma.staff.findMany({ orderBy: { staffId: "asc" } });
    res.json({ success: true, data: staffs });
  })
);

staffsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const staff = await prisma.staff.findUnique({
      where: { staffId: Number(req.params.id) },
      include: { salaryAdvances: { orderBy: { paymentDate: "desc" } } },
    });
    if (!staff) throw ApiError.notFound("Staff lama helin.");

    const advances = staff.salaryAdvances.filter((a) => a.paymentType === "Advance");
    const salaries = staff.salaryAdvances.filter((a) => a.paymentType === "Salary");
    const totalAdvance = advances.reduce((sum, a) => sum + Number(a.amount), 0);
    const totalSalaryPaid = salaries.reduce((sum, a) => sum + Number(a.amount), 0);

    res.json({ success: true, data: { ...staff, totalAdvance, totalSalaryPaid } });
  })
);

staffsRouter.post(
  "/",
  validateBody(schema),
  asyncHandler(async (req, res) => {
    const staff = await prisma.staff.create({ data: req.body });
    res.status(201).json({ success: true, data: staff });
  })
);

staffsRouter.put(
  "/:id",
  validateBody(schema),
  asyncHandler(async (req, res) => {
    const staff = await prisma.staff.update({
      where: { staffId: Number(req.params.id) },
      data: req.body,
    });
    res.json({ success: true, data: staff });
  })
);

staffsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.staff.delete({ where: { staffId: Number(req.params.id) } });
    res.json({ success: true, message: "Staff si guul leh ayaa loo tirtiray." });
  })
);

// ── Salary Advance: give an advance or pay salary, and log it to Finance ──
const advanceSchema = z.object({
  amount: z.coerce.number().positive("Amount waa in uu ka weyn yahay 0."),
  paymentType: z.enum(["Advance", "Salary"]).default("Advance"),
  notes: z.string().optional().nullable(),
});

staffsRouter.post(
  "/:id/advance",
  validateBody(advanceSchema),
  asyncHandler(async (req, res) => {
    const staffId = Number(req.params.id);
    const { amount, paymentType, notes } = req.body as z.infer<typeof advanceSchema>;

    const staff = await prisma.staff.findUnique({ where: { staffId } });
    if (!staff) throw ApiError.notFound("Staff lama helin.");

    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.salaryAdvance.create({
        data: {
          staffId,
          amount,
          paymentType,
          status: "Paid",
          paymentDate: new Date(),
          notes: notes ?? null,
        },
      });

      const title =
        paymentType === "Advance"
          ? `${staff.fullName} — Salary Advance`
          : `${staff.fullName} — Salary Payment`;

      await tx.finance.create({
        data: {
          description: title,
          income: 0,
          expense: amount,
          transactionDate: new Date(),
          category: "Staff",
        },
      });

      return record;
    });

    res.status(201).json({
      success: true,
      data: result,
      message:
        paymentType === "Advance"
          ? `✅ Advance $${amount.toFixed(2)} ayaa la siiyay ${staff.fullName}.`
          : `✅ Salary $${amount.toFixed(2)} ayaa la bixiyay ${staff.fullName}.`,
    });
  })
);

staffsRouter.delete(
  "/advances/:advanceId",
  asyncHandler(async (req, res) => {
    await prisma.salaryAdvance.delete({ where: { salaryAdvanceId: Number(req.params.advanceId) } });
    res.json({ success: true, message: "Advance si guul leh ayaa loo tirtiray." });
  })
);
