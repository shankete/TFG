import { z } from "zod";

// Esquema para el registro. Como `city` puede llegar como cadena vacía
// desde el formulario (los compradores no la rellenan), normalizamos
// primero la cadena vacía a undefined y luego comprobamos en el refine
// que los vendedores sí la han puesto.
export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    name: z.string().min(1, "El nombre es obligatorio"),
    role: z.enum(["buyer", "seller"]),
    city: z
      .string()
      .optional()
      .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
  })
  .refine(
    (data) => {
      if (data.role === "seller" && !data.city) return false;
      return true;
    },
    { message: "La ciudad es obligatoria para vendedores", path: ["city"] },
  );

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "La contraseña es obligatoria"),
});
