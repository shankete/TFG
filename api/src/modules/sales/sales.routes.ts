import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../../db/client";
import { orderItems, users } from "../../db/schema";
import { AppError } from "../../lib/errors";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";

const router = Router();

// Solo los vendedores pueden ver y gestionar sus ventas.
router.use(requireAuth, requireRole("seller"));

// Lista de ventas del vendedor (los items de pedidos donde él es el vendedor).
router.get("/", async (req, res, next) => {
  try {
    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.sellerId, req.user!.id),
      with: {
        order: {
          columns: {
            id: true,
            createdAt: true,
            shippingAddress: true,
            buyerId: true,
          },
        },
      },
    });

    // Para cada venta necesitamos también los datos del comprador.
    // Vamos a buscarlos uno a uno y guardándolos en un mapa para no repetir queries.
    const buyersCache: Record<string, { id: string; name: string; city: string | null }> = {};

    const resultado = [];
    for (const it of items) {
      const buyerId = it.order.buyerId;

      // Si todavía no lo hemos buscado, lo pedimos a la base de datos.
      if (!buyersCache[buyerId]) {
        const buyer = await db.query.users.findFirst({
          where: eq(users.id, buyerId),
          columns: { id: true, name: true, city: true },
        });
        if (buyer) {
          buyersCache[buyerId] = buyer;
        }
      }

      resultado.push({
        id: it.id,
        status: it.status,
        productName: it.productName,
        pricePerKg: Number(it.pricePerKg),
        kg: Number(it.kg),
        order: {
          id: it.order.id,
          createdAt: it.order.createdAt,
          shippingAddress: it.order.shippingAddress,
        },
        buyer: buyersCache[buyerId],
      });
    }

    res.json(resultado);
  } catch (e) {
    next(e);
  }
});

// El vendedor cambia el estado de un item: pendiente -> enviado, enviado -> entregado.
const updateSchema = z.object({ status: z.enum(["shipped", "delivered"]) });

router.patch("/:itemId", validateBody(updateSchema), async (req, res, next) => {
  try {
    // Comprobamos que el item es de un pedido vendido por este vendedor.
    const item = await db.query.orderItems.findFirst({
      where: and(eq(orderItems.id, req.params.itemId), eq(orderItems.sellerId, req.user!.id)),
    });
    if (!item) return next(new AppError(404, "Venta no encontrada"));

    const nuevoEstado = req.body.status as "shipped" | "delivered";

    // Solo permitimos transiciones lógicas: pending -> shipped, shipped -> delivered.
    let transicionValida = false;
    if (item.status === "pending" && nuevoEstado === "shipped") transicionValida = true;
    if (item.status === "shipped" && nuevoEstado === "delivered") transicionValida = true;

    if (!transicionValida) {
      return next(new AppError(409, "Cambio de estado no permitido"));
    }

    const updated = await db
      .update(orderItems)
      .set({ status: nuevoEstado })
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
