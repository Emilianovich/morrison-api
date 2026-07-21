import { Hono } from "hono"
import { deleteCookie, setCookie } from "hono/cookie"
import { z } from "zod"
import env from "../helpers/env.js"
import { authGrpcClient } from "../grpc/clients.js"
import type { AuthResponse, LoginResponse } from "../generated/auth.js"
import authMiddleware from "../middlewares/auth.js"
import ZodMiddleware from "../middlewares/zod.js"
import type { MiddlewareVars } from "../types/middleware-vars.js"
import { grpcErrorToHttp, isGrpcServiceError, unaryCall } from "../utils/grpc.js"

const auth = new Hono<MiddlewareVars>()

const credentialsSchema = z.object({
  email: z.email({
    error: "Debe ingresar un correo electrónico válido",
  }),

  password: z
    .string({
      error: "La contraseña es obligatoria",
    })
    .min(1, {
      error: "La contraseña es obligatoria",
    }),
})

const registerSchema = credentialsSchema.extend({
  fullName: z
    .string({
      error: "El nombre completo es obligatorio",
    })
    .trim()
    .min(1, {
      error: "El nombre completo es obligatorio",
    })
    .max(150, {
      error: "El nombre completo no puede superar los 150 caracteres",
    }),
})

function handle(error: unknown): never {
  if (isGrpcServiceError(error)) throw grpcErrorToHttp(error)
  throw error
}

auth.post("/login", ZodMiddleware("json", credentialsSchema), async (ctx) => {
  const input = ctx.req.valid("json")
  try {
    const response = await unaryCall<LoginResponse>((callback) => authGrpcClient.login(input, callback))
    setCookie(ctx, env.SESSION_COOKIE_NAME, response.sessionId, {
      httpOnly: true,
      sameSite: "Lax",
      secure: env.SESSION_COOKIE_SECURE,
      path: "/",
    })
    return ctx.json(`Bienvenido ${response.clientName}`)
  } catch (error) {
    return handle(error)
  }
})

auth.post("/register", ZodMiddleware("json", registerSchema), async (ctx) => {
  const { fullName, email, password } = ctx.req.valid("json")
  try {
    await unaryCall<AuthResponse>((callback) => authGrpcClient.register({ fullName, email, password }, callback))
    return ctx.json("Registro exitoso", 201)
  } catch (error) {
    return handle(error)
  }
})

auth.post("/logout", authMiddleware, async (ctx) => {
  try {
    await unaryCall<AuthResponse>((callback) => authGrpcClient.logout({ sessionId: ctx.get("session_id") }, callback))
    deleteCookie(ctx, env.SESSION_COOKIE_NAME, { path: "/" })
    return ctx.json("Cierre de sesión exitoso")
  } catch (error) {
    return handle(error)
  }
})

export default auth
