import { status, type ServiceError } from "@grpc/grpc-js"
import { HTTPException } from "hono/http-exception"

export function unaryCall<T>(invoke: (callback: (error: ServiceError | null, response: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    invoke((error, response) => {
      if (error) return reject(error)
      resolve(response)
    })
  })
}

const domainMessages: Record<string, string> = {
  INVALID_CREDENTIALS: "Correo o contraseña incorrectos",
  INVALID_SESSION: "Sesión inválida",
  EMAIL_ALREADY_EXISTS: "El correo ya está registrado",
  INVALID_QUANTITY: "La cantidad indicada no es válida",
  BOOK_NOT_FOUND: "Libro no encontrado",
  CLIENT_NOT_FOUND: "No se encontró un cliente con ese id",
  INSUFFICIENT_STOCK: "Se acabaron las unidades del libro deseado",
  INSUFFICIENT_BALANCE: "No tiene saldo suficiente para comprar el libro",
}

export function isGrpcServiceError(error: unknown): error is ServiceError {
  return typeof error === "object" && error !== null && "code" in error && "details" in error
}

export function grpcErrorToHttp(error: ServiceError): HTTPException {
  const message = domainMessages[error.details] ?? error.details ?? "No fue posible completar la operación"
  switch (error.code) {
    case status.INVALID_ARGUMENT:
      return new HTTPException(400, { message })
    case status.UNAUTHENTICATED:
      return new HTTPException(401, { message })
    case status.NOT_FOUND:
      return new HTTPException(404, { message })
    case status.ALREADY_EXISTS:
      return new HTTPException(409, { message })
    case status.FAILED_PRECONDITION:
      return new HTTPException(409, { message })
    case status.UNAVAILABLE:
      return new HTTPException(503, { message: "El servicio de lógica de negocio no está disponible" })
    default:
      return new HTTPException(500, { message: "Error interno del servidor" })
  }
}

export function domainCode(error: unknown): string {
  return isGrpcServiceError(error) && error.details ? error.details : "INTERNAL_ERROR"
}
