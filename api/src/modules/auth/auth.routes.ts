import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../../db/client";
import { users } from "../../db/schema";
import { AppError } from "../../lib/errors";
import { signToken } from "../../lib/jwt";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { loginSchema, registerSchema } from "./auth.schemas";

const router = Router();

// Registro de un nuevo usuario (buyer o seller).
router.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name, role, city } = req.body;

    // Comprobamos que no exista ya un usuario con ese email.
    const yaExiste = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (yaExiste) {
      return next(new AppError(409, "Ese email ya está registrado"));
    }

    // Hasheamos la contraseña antes de guardarla.
    const passwordHash = await bcrypt.hash(password, 10);

    const inserted = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name,
        role,
        city: city ?? null,
      })
      .returning();
    const nuevo = inserted[0];

    const token = signToken({ sub: nuevo.id, role: nuevo.role });
    res.json({
      token,
      user: {
        id: nuevo.id,
        email: nuevo.email,
        name: nuevo.name,
        role: nuevo.role,
        city: nuevo.city,
      },
    });
  } catch (e) {
    next(e);
  }
});

// Login de un usuario que ya existe.
router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      return next(new AppError(401, "Email o contraseña incorrectos"));
    }
    if (user.bannedAt) {
      return next(new AppError(403, "Cuenta bloqueada"));
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return next(new AppError(401, "Email o contraseña incorrectos"));
    }

    const token = signToken({ sub: user.id, role: user.role });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        city: user.city,
      },
    });
  } catch (e) {
    next(e);
  }
});

// Devuelve los datos del usuario logueado.
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.id) });
    if (!user) return next(new AppError(404, "Usuario no encontrado"));

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      city: user.city,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
