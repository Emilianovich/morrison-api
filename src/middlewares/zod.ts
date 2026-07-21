import { zValidator as zv } from "@hono/zod-validator"
import type { ValidationTargets } from "hono"
import { z } from "zod"

export type ValidationErrorBody = {
  formErrors: string[]
  fieldErrors: Record<string, string[] | undefined>
}

export class RequestValidationError extends Error {
  readonly status = 400
  readonly validationErrors: ValidationErrorBody

  constructor(validationErrors: ValidationErrorBody) {
    super("La solicitud contiene datos inválidos")
    this.name = "RequestValidationError"
    this.validationErrors = validationErrors
  }
}

const ZodMiddleware = <
  T extends z.ZodType,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T,
) =>
  zv(target, schema, (result) => {
    if (!result.success) {
      throw new RequestValidationError(
        z.flattenError(result.error),
      )
    }
  })

export default ZodMiddleware