import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parseModules } from "../config/modules.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { comparePassword, hashPassword, normalizeAnswer, validatePasswordPolicy } from "../utils/password.js";

export const authRouter = Router();

const REFRESH_COOKIE = "ramada_refresh_token";
const isProd = process.env.NODE_ENV === "production";

function setRefreshCookie(res: import("express").Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth",
  });
}

// ── POST /api/auth/login ────────────────────────────────────────
const loginSchema = z.object({
  username: z.string().min(1, "Username waa lagama maarmaan."),
  password: z.string().min(1, "Password waa lagama maarmaan."),
});

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body as z.infer<typeof loginSchema>;

    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });

    if (!user) {
      throw ApiError.unauthorized("Username ama password midbaa khaldan. Fadlan hubi.");
    }

    const passwordOk = await comparePassword(password, user.passwordHash);
    if (!passwordOk) {
      throw ApiError.unauthorized("Username ama Password khalad ah. Fadlan mar kale isku day.");
    }

    if (!user.role) {
      throw ApiError.forbidden("User-kan role lama xidhin. Admin la xiriir.");
    }

    const allowedModules = parseModules(user.allowedModules);

    const accessToken = signAccessToken({
      userId: user.userId,
      username: user.username,
      fullName: user.fullName ?? user.username,
      role: user.role.roleName,
      allowedModules,
    });
    const refreshToken = signRefreshToken({ userId: user.userId });

    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          userId: user.userId,
          username: user.username,
          fullName: user.fullName,
          role: user.role.roleName,
          allowedModules,
        },
      },
    });
  })
);

// ── POST /api/auth/refresh ──────────────────────────────────────
authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw ApiError.unauthorized("Fadlan mar kale soo gal.");

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw ApiError.unauthorized("Session-kaagu wuu dhacay. Fadlan mar kale soo gal.");
    }

    const user = await prisma.user.findUnique({
      where: { userId: payload.userId },
      include: { role: true },
    });
    if (!user || !user.role) throw ApiError.unauthorized();

    const allowedModules = parseModules(user.allowedModules);
    const accessToken = signAccessToken({
      userId: user.userId,
      username: user.username,
      fullName: user.fullName ?? user.username,
      role: user.role.roleName,
      allowedModules,
    });

    res.json({ success: true, data: { accessToken } });
  })
);

// ── POST /api/auth/logout ───────────────────────────────────────
authRouter.post("/logout", (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.json({ success: true, message: "Si guul leh ayaad uga baxday." });
});

// ── GET /api/auth/me ─────────────────────────────────────────────
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: req.user });
  })
);

// ── POST /api/auth/forgot-password (step 1: verify username) ───
const forgotSchema = z.object({ username: z.string().min(1) });

authRouter.post(
  "/forgot-password",
  validateBody(forgotSchema),
  asyncHandler(async (req, res) => {
    const { username } = req.body as z.infer<typeof forgotSchema>;
    const user = await prisma.user.findUnique({ where: { username: username.trim() } });

    if (!user || !user.securityQuestion || !user.securityAnswerHash) {
      throw ApiError.notFound(
        "Username lama helin, ama akoonkan Su'aal Sir ah looma dejin. Fadlan Admin la xiriir."
      );
    }

    res.json({
      success: true,
      data: { username: user.username, securityQuestion: user.securityQuestion },
    });
  })
);

// ── POST /api/auth/reset-password (step 2: answer + new password) ─
const resetSchema = z.object({
  username: z.string().min(1),
  securityAnswer: z.string().min(1, "Fadlan jawaabta su'aasha geli."),
  newPassword: z.string().min(1),
  confirmPassword: z.string().min(1),
});

authRouter.post(
  "/reset-password",
  validateBody(resetSchema),
  asyncHandler(async (req, res) => {
    const { username, securityAnswer, newPassword, confirmPassword } = req.body as z.infer<
      typeof resetSchema
    >;

    const pwError = validatePasswordPolicy(newPassword);
    if (pwError) throw ApiError.badRequest(pwError);
    if (newPassword !== confirmPassword) throw ApiError.badRequest("Password-yadu isma mid aha.");

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.securityAnswerHash) throw ApiError.notFound("User lama helin.");

    const answerOk = await comparePassword(normalizeAnswer(securityAnswer), user.securityAnswerHash);
    if (!answerOk) throw ApiError.badRequest("Jawaabtu khalad ah. Fadlan mar kale isku day.");

    await prisma.user.update({
      where: { userId: user.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    res.json({ success: true, message: "Password-kaaga si guul leh ayaa loo beddelay." });
  })
);
