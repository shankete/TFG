import { eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../../db/client";
import { products } from "../../db/schema";
import { AppError } from "../../lib/errors";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";

const router = Router();

// Solo admins pueden gestionar productos del catálogo.
router.use(requireAuth, requireRole("admin"));

const createSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "El slug solo puede tener minúsculas, números y guiones"),
  description: z.string().default(""),
  imageUrl: z.string().url(),
  categoryId: z.string().uuid(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  categoryId: z.string().uuid().optional(),
});

// Listar todos los productos.
router.get("/", async (_req, res, next) => {
  try {
    const rows = await db.query.products.findMany({
      with: { category: true },
      orderBy: (p, { asc }) => asc(p.name),
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// Crear producto.
router.post("/", validateBody(createSchema), async (req, res, next) => {
  try {
    // Antes de insertar comprobamos si ya hay otro producto con ese slug.
    const yaExiste = await db.query.products.findFirst({ where: eq(products.slug, req.body.slug) });
    if (yaExiste) {
      return next(new AppError(409, "Ya existe un producto con ese slug"));
    }
    const inserted = await db.insert(products).values(req.body).returning();
    res.json(inserted[0]);
  } catch (e) {
    next(e);
  }
});

// Editar producto.
router.patch("/:id", validateBody(updateSchema), async (req, res, next) => {
  try {
    const updated = await db
      .update(products)
      .set(req.body)
      .where(eq(products.id, req.params.id))
      .returning();
    if (updated.length === 0) return next(new AppError(404, "Producto no encontrado"));
    res.json(updated[0]);
  } catch (e) {
    next(e);
  }
});

// Borrar producto.
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await db
      .delete(products)
      .where(eq(products.id, req.params.id))
      .returning();
    if (deleted.length === 0) return next(new AppError(404, "Producto no encontrado"));
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
