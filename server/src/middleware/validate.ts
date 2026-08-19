import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * Validates req.body (default) against a zod schema. On success, req.body
 * is replaced with the parsed/coerced value.
 */
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(ApiError.badRequest("Xogta la geliyay sax ma aha.", result.error.flatten()));
    }
    req.body = result.data;
    return next();
  };
}

export function validateQuery(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(ApiError.badRequest("Query params sax ma aha.", result.error.flatten()));
    }
    (req as unknown as { query: unknown }).query = result.data;
    return next();
  };
}
