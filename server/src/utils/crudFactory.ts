import { Router } from "express";
import type { ZodType } from "zod";
import { requireAuth, requireModule } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

interface DelegateLike {
  findMany: (args?: unknown) => Promise<unknown[]>;
  findUnique: (args: unknown) => Promise<unknown>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
}

/**
 * Builds a standard REST router (GET list, GET one, POST, PUT, DELETE)
 * for a straightforward Prisma model — used for the modules that don't
 * need custom calculated fields (RoomTypes, FoodItems, Expenses, ...).
 */
export function buildCrudRouter<T extends DelegateLike>(opts: {
  delegate: T;
  idField: string;
  moduleKey: string;
  createSchema: ZodType;
  updateSchema?: ZodType;
  include?: unknown;
  orderBy?: unknown;
  notFoundMessage?: string;
}) {
  const router = Router();
  const { delegate, idField, moduleKey, createSchema, include, orderBy } = opts;
  const updateSchema = opts.updateSchema ?? createSchema;
  const notFound = opts.notFoundMessage ?? "Xogta la doonayo lama helin.";

  router.use(requireAuth, requireModule(moduleKey));

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      const rows = await delegate.findMany({ include, orderBy });
      res.json({ success: true, data: rows });
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const row = await delegate.findUnique({
        where: { [idField]: Number(req.params.id) },
        include,
      });
      if (!row) throw ApiError.notFound(notFound);
      res.json({ success: true, data: row });
    })
  );

  router.post(
    "/",
    validateBody(createSchema),
    asyncHandler(async (req, res) => {
      const row = await delegate.create({ data: req.body, include });
      res.status(201).json({ success: true, data: row });
    })
  );

  router.put(
    "/:id",
    validateBody(updateSchema),
    asyncHandler(async (req, res) => {
      const row = await delegate.update({
        where: { [idField]: Number(req.params.id) },
        data: req.body,
        include,
      });
      res.json({ success: true, data: row });
    })
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      await delegate.delete({ where: { [idField]: Number(req.params.id) } });
      res.json({ success: true, message: "Si guul leh ayaa loo tirtiray." });
    })
  );

  return router;
}
