import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../../db/client";
import { listings, users } from "../../db/schema";
import { AppError } from "../../lib/errors";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

// Solo admins.
router.use(requireAuth, requireRole("admin"));

// Lista de todos los usuarios.
router.get("/", async (_req, res, next) => {
  try {
    const rows = await db.query.users.findMany({
      orderBy: (u, { asc }) => asc(u.createdAt),
    });
    const resultado = rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      city: u.city,
      banned: u.bannedAt !== null,
      createdAt: u.createdAt,
    }));
    res.json(resultado);
  } catch (e) {
    next(e);
  }
});

// Banea a un usuario. Si es vendedor, también desactiva sus ofertas
// para que no aparezcan en el catálogo.
router.patch("/:id/ban", async (req, res, next) => {
  try {
    const target = await db.query.users.findFirst({ where: eq(users.id, req.params.id) });
    if (!target) return next(new AppError(404, "Usuario no encontrado"));

    if (target.role === "admin") {
      return next(new AppError(403, "No se puede banear a un administrador"));
    }

    // Lo hacemos en una transacción para que ambas cosas se hagan juntas.
    await db.transaction(async (tx) => {
      await tx.update(users).set({ bannedAt: new Date() }).where(eq(users.id, target.id));

      if (target.role === "seller") {
        await tx.update(listings).set({ active: false }).where(eq(listings.sellerId, target.id));
      }
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Desbanea a un usuario (no reactivamos automáticamente sus ofertas).
router.patch("/:id/unban", async (req, res, next) => {
  try {
    await db.update(users).set({ bannedAt: null }).where(eq(users.id, req.params.id));
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
