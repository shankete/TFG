import { z } from "zod";
import { es } from "zod/locales";

// Activamos los mensajes de error de Zod en español para toda la API.
// Así, si un campo no cumple un validador, el mensaje sale en castellano.
z.config(es());
