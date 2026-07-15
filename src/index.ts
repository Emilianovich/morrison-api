import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import type {MiddlewareVars} from "./types/middleware-vars.js";
import {HTTPException} from "hono/http-exception";
import generalMiddleware from "./middlewares/general.js";

const app = new Hono<MiddlewareVars>()

app.onError((err, ctx) => {
  if (err instanceof HTTPException) {
    return ctx.json({
      errors: err.cause ?? err.message
    })
  }
  ctx.status(500)
  return ctx.json({
    errors: "Error interno del servidor, intente nuevamente"
  })
})

app.use(generalMiddleware)

app.get('/health', (c) => {
  return c.text('API REST en buen estado')
})

serve({
  fetch: app.fetch,
  port: 3124
}, (info) => {
  console.log(`Servidor corriendo en http://localhost:${info.port}`)
})
