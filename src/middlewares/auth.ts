import { createMiddleware } from "hono/factory"
import { getCookie } from "hono/cookie"
import { HTTPException } from "hono/http-exception"
import env from "../helpers/env.js"
import type { MiddlewareVars } from "../types/middleware-vars.js"

const authMiddleware = createMiddleware<MiddlewareVars>(async (ctx, next) => {
  const sessionId = getCookie(ctx, env.SESSION_COOKIE_NAME)
  if (!sessionId) {
    throw new HTTPException(401, { message: "Sesión no válida. Vuelva a iniciar sesión" })
  }
  ctx.set("session_id", sessionId)
  await next()
})

export default authMiddleware
