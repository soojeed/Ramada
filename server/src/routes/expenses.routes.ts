import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { buildCrudRouter } from "../utils/crudFactory.js";

const schema = z.object({
  title: z.string().min(1, "Title waa lagama maarmaan."),
  amount: z.coerce.number().nonnegative(),
  category: z.string().optional().nullable(),
  expenseDate: z.coerce.date().optional(),
  notes: z.string().optional().nullable(),
});

export const expensesRouter = buildCrudRouter({
  delegate: prisma.expense,
  idField: "expenseId",
  moduleKey: "Expenses",
  createSchema: schema,
  orderBy: { expenseDate: "desc" },
  notFoundMessage: "Expense lama helin.",
});
