import { createMiddleware } from "hono/factory"
import type { MiddlewareVars } from "../types/middleware-vars.js"

const generalMiddleware = createMiddleware<MiddlewareVars>(async (ctx, next) => {
  await next()
  if (ctx.res.status >= 200 && ctx.res.status < 300 && ctx.res.headers.get("content-type")?.includes("application/json")) {
    const body = await ctx.res.clone().json()
    ctx.res = new Response(JSON.stringify({ content: body }), {
      status: ctx.res.status,
      headers: ctx.res.headers,
    })
  }
})

export default generalMiddleware
