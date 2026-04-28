import { Router } from "express";
import { db } from "../../db/client";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

// Solo admins.
router.use(requireAuth, requireRole("admin"));

// Lista de todas las ofertas (listings) de todos los vendedores.
router.get("/", async (_req, res, next) => {
  try {
    const rows = await db.query.listings.findMany({
      with: {
        product: true,
        seller: { columns: { id: true, name: true, email: true, city: true } },
      },
      orderBy: (l, { desc }) => desc(l.createdAt),
    });
    const resultado = rows.map((r) => ({ ...r, pricePerKg: Number(r.pricePerKg) }));
    res.json(resultado);
  } catch (e) {
    next(e);
  }
});

export default router;
