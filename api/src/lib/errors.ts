// Pequeña clase para lanzar errores con un status HTTP
// y que el handler de express los pille y los devuelva al cliente.
export class AppError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
