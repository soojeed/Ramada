import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { ApiError } from "../utils/ApiError.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route lama helin: ${req.method} ${req.originalUrl}`));
}

/**
 * Single place that turns any thrown error (ApiError, Prisma error, Zod
 * error, or an unexpected bug) into a consistent JSON response shape:
 *   { success: false, message, details? }
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // Known, intentional application error
  if (err instanceof ApiError) {
    if (!err.isOperational) {
      console.error("[UNEXPECTED ERROR]", err);
    }
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Prisma known request errors (unique constraint, FK violation, not found, ...)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const map: Record<string, { status: number; message: string }> = {
      P2002: { status: 409, message: "Xogtan horey ayaa loo diiwaan geliyay (unique constraint)." },
      P2003: { status: 409, message: "Ma tirtiri kartid — xogtan waxaa isticmaalaya rikoodh kale (foreign key)." },
      P2025: { status: 404, message: "Xogta la doonayo lama helin." },
    };
    const known = map[err.code] ?? { status: 400, message: "Database khalad ayaa dhacay." };
    return res.status(known.status).json({
      success: false,
      message: known.message,
      details: process.env.NODE_ENV === "development" ? { code: err.code, meta: err.meta } : undefined,
    });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: "Xogta la geliyay khalad ayay leedahay (validation).",
    });
  }

  // Anything else — unexpected bug
  console.error("[UNHANDLED ERROR]", err);
  const message =
    process.env.NODE_ENV === "development" && err instanceof Error
      ? err.message
      : "System khalad ayaa dhacay. Fadlan mar kale isku day.";

  return res.status(500).json({ success: false, message });
}
