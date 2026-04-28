import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../../db/client";
import { cartItems, listings } from "../../db/schema";
import { AppError } from "../../lib/errors";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";

const router = Router();

// Todas las rutas del carrito son solo para compradores logueados.
router.use(requireAuth, requireRole("buyer"));

// Esquemas de validación.
const addSchema = z.object({
  listingId: z.string().uuid(),
  kg: z.number().positive(),
});
const updateSchema = z.object({ kg: z.number().positive() });

// Devuelve los items del carrito del usuario actual.
router.get("/", async (req, res, next) => {
  try {
    const items = await db.query.cartItems.findMany({
      where: eq(cartItems.buyerId, req.user!.id),
      with: {
        listing: {
          with: {
            product: true,
            seller: { columns: { id: true, name: true, city: true } },
          },
        },
      },
    });

    // Transformamos a un formato más cómodo para el front.
    const resultado = items.map((item) => ({
      id: item.id,
      kg: Number(item.kg),
      listingId: item.listingId,
      listing: {
        id: item.listing.id,
        pricePerKg: Number(item.listing.pricePerKg),
        active: item.listing.active,
        product: {
          id: item.listing.product.id,
          name: item.listing.product.name,
          imageUrl: item.listing.product.imageUrl,
        },
        seller: item.listing.seller,
      },
    }));

    res.json(resultado);
  } catch (e) {
    next(e);
  }
});

// Añade un producto al carrito. Si ya estaba, le sumamos los kg.
router.post("/", validateBody(addSchema), async (req, res, next) => {
  try {
    const { listingId, kg } = req.body;

    // Comprobamos que la oferta exista y esté activa.
    const oferta = await db.query.listings.findFirst({ where: eq(listings.id, listingId) });
    if (!oferta || !oferta.active) {
      return next(new AppError(400, "Esta oferta no está disponible"));
    }

    // ¿Ya tenía el usuario este listing en el carrito?
    const yaEnCarrito = await db.query.cartItems.findFirst({
      where: and(eq(cartItems.buyerId, req.user!.id), eq(cartItems.listingId, listingId)),
    });

    if (yaEnCarrito) {
      // Si ya estaba, sumamos los kg en vez de crear otra fila.
      const nuevosKg = Number(yaEnCarrito.kg) + kg;
      const updated = await db
        .update(cartItems)
        .set({ kg: nuevosKg.toFixed(2) })
        .where(eq(cartItems.id, yaEnCarrito.id))
        .returning();
      return res.json(updated[0]);
    }

    // Si no estaba, creamos una fila nueva.
    const inserted = await db
      .insert(cartItems)
      .values({
        buyerId: req.user!.id,
        listingId,
        kg: kg.toFixed(2),
      })
      .returning();
    res.json(inserted[0]);
  } catch (e) {
    next(e);
  }
});

// Cambia los kg de un item del carrito.
router.patch("/:id", validateBody(updateSchema), async (req, res, next) => {
  try {
    // Comprobamos que el item es del usuario que llama.
    const item = await db.query.cartItems.findFirst({
      where: and(eq(cartItems.id, req.params.id), eq(cartItems.buyerId, req.user!.id)),
    });
    if (!item) return next(new AppError(404, "Item no encontrado"));

    const updated = await db
      .update(cartItems)
      .set({ kg: req.body.kg.toFixed(2) })
      .where(eq(cartItems.id, req.params.id))
      .returning();
    res.json(updated[0]);
  } catch (e) {
    next(e);
  }
});

// Borra un item del carrito.
router.delete("/:id", async (req, res, next) => {
  try {
    const item = await db.query.cartItems.findFirst({
      where: and(eq(cartItems.id, req.params.id), eq(cartItems.buyerId, req.user!.id)),
    });
    if (!item) return next(new AppError(404, "Item no encontrado"));

    await db.delete(cartItems).where(eq(cartItems.id, req.params.id));
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
