import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../lib/errors";

// Middleware muy simple para validar el body de una request con Zod.
// Si falla devuelve un 400 con el mensaje de Zod.
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const msg = result.error.issues.map((i) => i.message).join(", ");
      return next(new AppError(400, msg));
    }
    req.body = result.data;
    next();
  };
}
