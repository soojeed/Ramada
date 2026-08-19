import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const rolesRouter = Router();
rolesRouter.use(requireAuth, requireAdmin);

const roleSchema = z.object({
  roleName: z.string().min(1, "Role name waa lagama maarmaan."),
});

rolesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const roles = await prisma.role.findMany({ orderBy: { roleId: "asc" } });
    res.json({ success: true, data: roles });
  })
);

rolesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const role = await prisma.role.findUnique({ where: { roleId: Number(req.params.id) } });
    if (!role) throw ApiError.notFound("Role lama helin.");
    res.json({ success: true, data: role });
  })
);

rolesRouter.post(
  "/",
  validateBody(roleSchema),
  asyncHandler(async (req, res) => {
    const role = await prisma.role.create({ data: req.body });
    res.status(201).json({ success: true, data: role });
  })
);

rolesRouter.put(
  "/:id",
  validateBody(roleSchema),
  asyncHandler(async (req, res) => {
    const role = await prisma.role.update({
      where: { roleId: Number(req.params.id) },
      data: req.body,
    });
    res.json({ success: true, data: role });
  })
);

rolesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.role.delete({ where: { roleId: Number(req.params.id) } });
    res.json({ success: true, message: "Role si guul leh ayaa loo tirtiray." });
  })
);
