import "dotenv/config";
import "./lib/zod-es";
import cors from "cors";
import express from "express";
import { AppError } from "./lib/errors";

import authRouter from "./modules/auth/auth.routes";
import productsRouter from "./modules/products/products.routes";
import categoriesRouter from "./modules/categories/categories.routes";
import adminProductsRouter from "./modules/admin/products.admin.routes";
import meListingsRouter from "./modules/listings/listings.routes";
import adminListingsRouter from "./modules/admin/listings.admin.routes";
import cartRouter from "./modules/cart/cart.routes";
import ordersRouter from "./modules/orders/orders.routes";
import salesRouter from "./modules/sales/sales.routes";
import adminUsersRouter from "./modules/admin/users.admin.routes";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());

// Endpoint para comprobar que el servidor está vivo.
app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Registramos las rutas de cada módulo.
app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/categories", categoriesRouter);
app.use("/admin/products", adminProductsRouter);
app.use("/me/listings", meListingsRouter);
app.use("/admin/listings", adminListingsRouter);
app.use("/me/cart", cartRouter);
app.use("/me/orders", ordersRouter);
app.use("/me/sales", salesRouter);
app.use("/admin/users", adminUsersRouter);

// Manejador de errores. Si es un AppError devolvemos su status,
// si no, asumimos que es un error interno.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { message: err.message } });
  }
  console.error("Error no controlado:", err);
  res.status(500).json({ error: { message: "Error interno del servidor" } });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`API arrancada en el puerto ${port}`);
});
