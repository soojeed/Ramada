import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { MODULE_KEYS, toModulesCsv, parseModules, APP_MODULES } from "../config/modules.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { hashPassword, normalizeAnswer, validatePasswordPolicy } from "../utils/password.js";

export const usersRouter = Router();
usersRouter.use(requireAuth, requireAdmin);

export const SECURITY_QUESTIONS = [
  "Magaca hooyadaa ugu horeysay?",
  "Magaca dugsiga aad wax ku bartay ee ugu horeysay?",
  "Magaca deegaanka aad ku dhalatay?",
  "Magaca saaxiibkaagii/saaxiibaddaadii ugu horeysay?",
  "Magaca xayawaanka guriga aad ku korisay ee ugu horeysay?",
];

usersRouter.get(
  "/meta/options",
  asyncHandler(async (_req, res) => {
    const roles = await prisma.role.findMany({ orderBy: { roleId: "asc" } });
    res.json({
      success: true,
      data: { roles, securityQuestions: SECURITY_QUESTIONS, modules: APP_MODULES },
    });
  })
);

usersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { userId: "asc" },
    });
    res.json({
      success: true,
      data: users.map((u) => ({
        userId: u.userId,
        fullName: u.fullName,
        username: u.username,
        roleId: u.roleId,
        role: u.role?.roleName,
        createdAt: u.createdAt,
        allowedModules: parseModules(u.allowedModules),
      })),
    });
  })
);

usersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { userId: Number(req.params.id) },
      include: { role: true },
    });
    if (!user) throw ApiError.notFound("User lama helin.");
    res.json({
      success: true,
      data: {
        userId: user.userId,
        fullName: user.fullName,
        username: user.username,
        roleId: user.roleId,
        role: user.role?.roleName,
        securityQuestion: user.securityQuestion,
        allowedModules: parseModules(user.allowedModules),
      },
    });
  })
);

const createSchema = z.object({
  fullName: z.string().min(1),
  username: z.string().min(1),
  roleId: z.coerce.number().int(),
  password: z.string().min(1),
  securityQuestion: z.string().min(1),
  securityAnswer: z.string().min(1),
  selectedModules: z.array(z.string()).optional().default([]),
});

usersRouter.post(
  "/",
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;

    const pwError = validatePasswordPolicy(body.password);
    if (pwError) throw ApiError.badRequest(pwError);

    const exists = await prisma.user.findUnique({ where: { username: body.username } });
    if (exists) throw ApiError.conflict("Username horay ayuu u jiray.");

    const user = await prisma.user.create({
      data: {
        fullName: body.fullName,
        username: body.username,
        roleId: body.roleId,
        passwordHash: await hashPassword(body.password),
        securityQuestion: body.securityQuestion,
        securityAnswerHash: await hashPassword(normalizeAnswer(body.securityAnswer)),
        allowedModules: toModulesCsv(body.selectedModules.filter((m) => MODULE_KEYS.includes(m))),
      },
    });

    res.status(201).json({ success: true, data: { userId: user.userId } });
  })
);

const updateSchema = z.object({
  fullName: z.string().min(1),
  username: z.string().min(1),
  roleId: z.coerce.number().int(),
  newPassword: z.string().optional(),
  securityQuestion: z.string().optional(),
  securityAnswer: z.string().optional(),
  selectedModules: z.array(z.string()).optional().default([]),
});

usersRouter.put(
  "/:id",
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const body = req.body as z.infer<typeof updateSchema>;

    const existing = await prisma.user.findUnique({ where: { userId: id } });
    if (!existing) throw ApiError.notFound("User lama helin.");

    const dup = await prisma.user.findFirst({
      where: { username: body.username, NOT: { userId: id } },
    });
    if (dup) throw ApiError.conflict("Username horay ayuu u jiray.");

    if (body.newPassword) {
      const pwError = validatePasswordPolicy(body.newPassword);
      if (pwError) throw ApiError.badRequest(pwError);
    }

    const user = await prisma.user.update({
      where: { userId: id },
      data: {
        fullName: body.fullName,
        username: body.username,
        roleId: body.roleId,
        allowedModules: toModulesCsv(body.selectedModules.filter((m) => MODULE_KEYS.includes(m))),
        ...(body.newPassword ? { passwordHash: await hashPassword(body.newPassword) } : {}),
        ...(body.securityQuestion ? { securityQuestion: body.securityQuestion } : {}),
        ...(body.securityAnswer
          ? { securityAnswerHash: await hashPassword(normalizeAnswer(body.securityAnswer)) }
          : {}),
      },
    });

    res.json({ success: true, data: { userId: user.userId } });
  })
);

usersRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (req.user!.userId === id) {
      throw ApiError.badRequest("Ma tirtiri kartid akoonkaaga laftiisa.");
    }
    const existing = await prisma.user.findUnique({ where: { userId: id } });
    if (!existing) throw ApiError.notFound("User lama helin.");

    await prisma.user.delete({ where: { userId: id } });
    res.json({ success: true, message: "User si guul leh ayaa loo tirtiray." });
  })
);

const resetPwSchema = z.object({
  newPassword: z.string().min(1),
  confirmPassword: z.string().min(1),
});

usersRouter.post(
  "/:id/reset-password",
  validateBody(resetPwSchema),
  asyncHandler(async (req, res) => {
    const { newPassword, confirmPassword } = req.body as z.infer<typeof resetPwSchema>;
    if (newPassword !== confirmPassword) throw ApiError.badRequest("Password-yadu isma mid aha.");
    const pwError = validatePasswordPolicy(newPassword);
    if (pwError) throw ApiError.badRequest(pwError);

    const id = Number(req.params.id);
    const existing = await prisma.user.findUnique({ where: { userId: id } });
    if (!existing) throw ApiError.notFound("User lama helin.");

    await prisma.user.update({
      where: { userId: id },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    res.json({ success: true, message: "Password si guul leh ayaa loo beddelay." });
  })
);
