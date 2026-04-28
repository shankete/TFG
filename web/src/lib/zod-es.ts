import { z } from 'zod';
import { es } from 'zod/locales';

// Activamos los mensajes de error de Zod en español para toda la web.
z.config(es());
