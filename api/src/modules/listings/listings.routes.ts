import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../../db/client";
import { listings, orderItems } from "../../db/schema";
import { AppError } from "../../lib/errors";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";

const router = Router();

// Solo vendedores pueden gestionar sus propias ofertas.
router.use(requireAuth, requireRole("seller"));

const createSchema = z.object({
  productId: z.string().uuid(),
  pricePerKg: z.number().positive(),
});

const updateSchema = z.object({
  pricePerKg: z.number().positive().optional(),
  active: z.boolean().optional(),
});

// Lista de ofertas del vendedor.
router.get("/", async (req, res, next) => {
  try {
    const rows = await db.query.listings.findMany({
      where: eq(listings.sellerId, req.user!.id),
      with: { product: true },
      orderBy: (l, { desc }) => desc(l.createdAt),
    });
    // Convertimos pricePerKg de string a number.
    const resultado = rows.map((r) => ({ ...r, pricePerKg: Number(r.pricePerKg) }));
    res.json(resultado);
  } catch (e) {
    next(e);
  }
});

// Crear una oferta nueva.
router.post("/", validateBody(createSchema), async (req, res, next) => {
  try {
    const { productId, pricePerKg } = req.body;

    // Para evitar duplicados comprobamos a mano si ya hay una oferta de este vendedor
    // para este producto. (Además hay un unique index en la BBDD que lo impide.)
    const yaExiste = await db.query.listings.findFirst({
      where: and(eq(listings.sellerId, req.user!.id), eq(listings.productId, productId)),
    });
    if (yaExiste) {
      return next(new AppError(409, "Ya tienes una oferta para este producto"));
    }

    const inserted = await db
      .insert(listings)
      .values({
        sellerId: req.user!.id,
        productId,
        pricePerKg: pricePerKg.toFixed(2),
      })
      .returning();

    res.json({ ...inserted[0], pricePerKg: Number(inserted[0].pricePerKg) });
  } catch (e) {
    next(e);
  }
});

// Editar precio o estado activo/inactivo de una oferta.
router.patch("/:id", validateBody(updateSchema), async (req, res, next) => {
  try {
    // Comprobamos que la oferta es del vendedor.
    const oferta = await db.query.listings.findFirst({
      where: and(eq(listings.id, req.params.id), eq(listings.sellerId, req.user!.id)),
    });
    if (!oferta) return next(new AppError(404, "Oferta no encontrada"));

    // Construimos el objeto con los cambios solo con los campos que se han enviado.
    const cambios: { pricePerKg?: string; active?: boolean } = {};
    if (req.body.pricePerKg !== undefined) {
      cambios.pricePerKg = req.body.pricePerKg.toFixed(2);
    }
    if (req.body.active !== undefined) {
      cambios.active = req.body.active;
    }

    const updated = await db
      .update(listings)
      .set(cambios)
      .where(eq(listings.id, req.params.id))
      .returning();

    res.json({ ...updated[0], pricePerKg: Number(updated[0].pricePerKg) });
  } catch (e) {
    next(e);
  }
});

// Borrar una oferta. Si ya está usada en algún pedido la dejamos inactiva
// en lugar de borrarla, para no romper el historial.
router.delete("/:id", async (req, res, next) => {
  try {
    const oferta = await db.query.listings.findFirst({
      where: and(eq(listings.id, req.params.id), eq(listings.sellerId, req.user!.id)),
    });
    if (!oferta) return next(new AppError(404, "Oferta no encontrada"));

    // Miramos si esta oferta aparece en alguna línea de pedido.
    const usadaEnPedido = await db.query.orderItems.findFirst({
      where: eq(orderItems.listingId, req.params.id),
    });

    if (usadaEnPedido) {
      // Si está en un pedido, solo la desactivamos.
      await db.update(listings).set({ active: false }).where(eq(listings.id, req.params.id));
    } else {
      // Si no, la borramos del todo.
      await db.delete(listings).where(eq(listings.id, req.params.id));
    }

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
