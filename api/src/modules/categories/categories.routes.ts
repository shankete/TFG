import { Router } from "express";
import { db } from "../../db/client";

const router = Router();

// Lista de todas las categorías ordenadas por nombre.
router.get("/", async (_req, res, next) => {
  try {
    const rows = await db.query.categories.findMany({
      orderBy: (c, { asc }) => asc(c.name),
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

export default router;
