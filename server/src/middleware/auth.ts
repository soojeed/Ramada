import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/jwt.js";

/**
 * Requires a valid "Authorization: Bearer <token>" header.
 * Populates req.user with { userId, username, fullName, role, allowedModules }.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Fadlan soo gal (login) marka hore."));
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return next(ApiError.unauthorized("Session-kaagu wuu dhacay. Fadlan mar kale soo gal."));
  }
}

/**
 * Only lets "Admin" through. Equivalent to checks scattered in
 * UsersController / RolesController / BackupController in the old app.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.role !== "Admin") {
    return next(ApiError.forbidden("Qeybtan waxaa geli kara Admin oo kaliya."));
  }
  return next();
}

/**
 * Equivalent of ModuleAccessAttribute("<module>") — Admin always passes,
 * anyone else needs the module key present in their AllowedModules list.
 */
export function requireModule(moduleKey: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.role === "Admin") return next();

    if (req.user.allowedModules?.includes(moduleKey)) return next();

    return next(
      ApiError.forbidden(`⛔ Ogolaanshaha kuma jirto qeybtan (${moduleKey}). Admin la xiriir.`)
    );
  };
}
