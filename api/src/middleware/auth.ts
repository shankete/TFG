import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db } from "../db/client";
import { users } from "../db/schema";
import { AppError } from "../lib/errors";
import { verifyToken } from "../lib/jwt";

// Tipo del usuario que metemos en req.user para usarlo en las rutas.
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: "buyer" | "seller" | "admin" };
    }
  }
}

// Comprueba que la cabecera Authorization tenga un Bearer token válido.
// Si todo va bien deja el usuario en req.user.
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return next(new AppError(401, "No autenticado"));
    }
    const token = header.substring(7);
    const payload = verifyToken(token);

    const user = await db.query.users.findFirst({ where: eq(users.id, payload.sub) });
    if (!user) return next(new AppError(401, "No autenticado"));
    if (user.bannedAt) return next(new AppError(403, "Cuenta bloqueada"));

    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    // Token inválido o caducado
    next(new AppError(401, "No autenticado"));
  }
}

// Devuelve un middleware que comprueba que el usuario tiene uno de los roles indicados.
export function requireRole(...roles: Array<"buyer" | "seller" | "admin">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, "No autenticado"));
    if (!roles.includes(req.user.role)) return next(new AppError(403, "Sin permisos"));
    next();
  };
}
