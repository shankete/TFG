import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../../db/client";
import { cartItems, orderItems, orders } from "../../db/schema";
import { AppError } from "../../lib/errors";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";

const router = Router();

// Solo los compradores pueden hacer y ver sus pedidos.
router.use(requireAuth, requireRole("buyer"));

const checkoutSchema = z.object({
  shippingAddress: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
});

// Hacer un pedido (checkout). Coge lo que hay en el carrito y lo convierte en pedido.
router.post("/", validateBody(checkoutSchema), async (req, res, next) => {
  try {
    // Hacemos todo dentro de una transacción para que si algo falla
    // no quede un pedido a medias o el carrito vaciado sin pedido.
    const order = await db.transaction(async (tx) => {
      // 1. Buscamos los items del carrito con su listing y producto.
      const items = await tx.query.cartItems.findMany({
        where: eq(cartItems.buyerId, req.user!.id),
        with: { listing: { with: { product: true } } },
      });

      if (items.length === 0) {
        throw new AppError(400, "El carrito está vacío");
      }

      // 2. Comprobamos que todas las ofertas siguen activas.
      for (const it of items) {
        if (!it.listing.active) {
          throw new AppError(400, `La oferta ya no está disponible: ${it.listing.product.name}`);
        }
      }

      // 3. Calculamos el total sumando precio * kg de cada item.
      let total = 0;
      for (const it of items) {
        total += Number(it.listing.pricePerKg) * Number(it.kg);
      }

      // 4. Insertamos el pedido.
      const inserted = await tx
        .insert(orders)
        .values({
          buyerId: req.user!.id,
          shippingAddress: req.body.shippingAddress,
          total: total.toFixed(2),
        })
        .returning();
      const nuevoPedido = inserted[0];

      // 5. Insertamos las líneas del pedido (una por item del carrito).
      const filasPedido = items.map((it) => ({
        orderId: nuevoPedido.id,
        listingId: it.listingId,
        sellerId: it.listing.sellerId,
        productName: it.listing.product.name,
        pricePerKg: it.listing.pricePerKg,
        kg: it.kg,
        status: "pending" as const,
      }));
      await tx.insert(orderItems).values(filasPedido);

      // 6. Vaciamos el carrito.
      await tx.delete(cartItems).where(eq(cartItems.buyerId, req.user!.id));

      return nuevoPedido;
    });

    res.json({ id: order.id });
  } catch (e) {
    next(e);
  }
});

// Lista de pedidos del usuario.
router.get("/", async (req, res, next) => {
  try {
    const rows = await db.query.orders.findMany({
      where: eq(orders.buyerId, req.user!.id),
      with: { items: true },
      orderBy: (o, { desc }) => desc(o.createdAt),
    });

    // Convertimos los numeric de Postgres (que vienen como string) a number.
    const resultado = rows.map((o) => ({
      ...o,
      total: Number(o.total),
      items: o.items.map((i) => ({
        ...i,
        pricePerKg: Number(i.pricePerKg),
        kg: Number(i.kg),
      })),
    }));

    res.json(resultado);
  } catch (e) {
    next(e);
  }
});

// Detalle de un pedido concreto.
router.get("/:id", async (req, res, next) => {
  try {
    const o = await db.query.orders.findFirst({
      where: and(eq(orders.id, req.params.id), eq(orders.buyerId, req.user!.id)),
      with: { items: true },
    });
    if (!o) return next(new AppError(404, "Pedido no encontrado"));

    res.json({
      ...o,
      total: Number(o.total),
      items: o.items.map((i) => ({
        ...i,
        pricePerKg: Number(i.pricePerKg),
        kg: Number(i.kg),
      })),
    });
  } catch (e) {
    next(e);
  }
});

// El comprador confirma que ha recibido un item del pedido.
router.patch("/:orderId/items/:itemId/confirm", async (req, res, next) => {
  try {
    // Verificamos que el pedido pertenece al usuario.
    const pedido = await db.query.orders.findFirst({
      where: and(eq(orders.id, req.params.orderId), eq(orders.buyerId, req.user!.id)),
    });
    if (!pedido) return next(new AppError(404, "Pedido no encontrado"));

    // Buscamos el item dentro de ese pedido.
    const item = await db.query.orderItems.findFirst({
      where: and(eq(orderItems.id, req.params.itemId), eq(orderItems.orderId, req.params.orderId)),
    });
    if (!item) return next(new AppError(404, "Item no encontrado"));

    // Solo se puede confirmar si el vendedor ya lo ha enviado.
    if (item.status !== "shipped") {
      return next(new AppError(409, "Este item todavía no se ha enviado"));
    }

    const updated = await db
      .update(orderItems)
      .set({ status: "delivered" })
      .where(eq(orderItems.id, item.id))
      .returning();

    res.json({
      ...updated[0],
      pricePerKg: Number(updated[0].pricePerKg),
      kg: Number(updated[0].kg),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
