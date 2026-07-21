import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import authRoutes from "./routes/auth.js"
import bookRoutes from "./routes/books.js"
import clientRoutes from "./routes/clients.js"
import env from "./helpers/env.js"
import generalMiddleware from "./middlewares/general.js"
import { startTcpServer } from "./servers/tcp.js"
import type { MiddlewareVars } from "./types/middleware-vars.js"
import {
  RequestValidationError,
} from "./middlewares/zod.js"

const app = new Hono<MiddlewareVars>()

app.onError((error, ctx) => {
  if (error instanceof RequestValidationError) {
    return ctx.json(
      {
        errors: error.validationErrors,
      },
      400,
    )
  }

  if (error instanceof HTTPException) {
    return ctx.json(
      {
        errors: error.message,
      },
      error.status,
    )
  }

  console.error(error)

  return ctx.json(
    {
      errors: "Error interno del servidor, intente nuevamente",
    },
    500,
  )
})

app.use(generalMiddleware)
app.get("/health", (ctx) => ctx.json("API REST en buen estado"))
app.route("/auth", authRoutes)
app.route("/clients", clientRoutes)
app.route("/books", bookRoutes)

serve({ fetch: app.fetch, port: env.HTTP_PORT, hostname: "0.0.0.0" }, (info) => {
  console.log(`HTTP server listening on 0.0.0.0:${info.port}`)
})

startTcpServer()
