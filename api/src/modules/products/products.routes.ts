import { eq, ilike } from "drizzle-orm";
import { Router } from "express";
import { db } from "../../db/client";
import { products } from "../../db/schema";
import { AppError } from "../../lib/errors";

const router = Router();

// Listado público de productos. Acepta búsqueda por nombre y filtro por categoría.
router.get("/", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const category = typeof req.query.category === "string" ? req.query.category : "";

    // Si hay texto de búsqueda filtramos por nombre, si no traemos todos.
    const whereClause = q ? ilike(products.name, `%${q}%`) : undefined;

    const rows = await db.query.products.findMany({
      where: whereClause,
      with: {
        category: true,
        // Solo nos interesan las ofertas activas para calcular el precio mínimo.
        listings: {
          where: (l, { eq }) => eq(l.active, true),
          columns: { pricePerKg: true },
        },
      },
      orderBy: (p, { asc }) => asc(p.name),
    });

    // Filtro por categoría lo hacemos en JS porque ya tenemos el slug cargado.
    const filtrados = category ? rows.filter((r) => r.category.slug === category) : rows;

    // Calculamos el precio mínimo de cada producto recorriendo sus ofertas.
    const resultado = filtrados.map((p) => {
      let minPrecio: number | null = null;
      for (const l of p.listings) {
        const precio = Number(l.pricePerKg);
        if (minPrecio === null || precio < minPrecio) {
          minPrecio = precio;
        }
      }
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        imageUrl: p.imageUrl,
        category: {
          id: p.category.id,
          name: p.category.name,
          slug: p.category.slug,
        },
        minPricePerKg: minPrecio,
      };
    });

    res.json(resultado);
  } catch (e) {
    next(e);
  }
});

// Detalle de un producto con todos sus vendedores activos.
router.get("/:id", async (req, res, next) => {
  try {
    const p = await db.query.products.findFirst({
      where: eq(products.id, req.params.id),
      with: {
        category: true,
        listings: {
          where: (l, { eq }) => eq(l.active, true),
          with: {
            seller: { columns: { id: true, name: true, city: true, bannedAt: true } },
          },
        },
      },
    });
    if (!p) return next(new AppError(404, "Producto no encontrado"));

    // Si el vendedor está baneado no lo mostramos.
    const ofertasVisibles = [];
    for (const l of p.listings) {
      if (l.seller.bannedAt) continue;
      ofertasVisibles.push({
        id: l.id,
        pricePerKg: Number(l.pricePerKg),
        seller: {
          id: l.seller.id,
          name: l.seller.name,
          city: l.seller.city,
        },
      });
    }

    res.json({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      imageUrl: p.imageUrl,
      category: p.category,
      listings: ofertasVisibles,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
