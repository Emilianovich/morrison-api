import { Hono } from "hono"
import { clientGrpcClient } from "../grpc/clients.js"
import type { GetClientResponse } from "../generated/clients.js"
import authMiddleware from "../middlewares/auth.js"
import type { MiddlewareVars } from "../types/middleware-vars.js"
import { grpcErrorToHttp, isGrpcServiceError, unaryCall } from "../utils/grpc.js"
import { formatCents } from "../utils/money.js"

const clients = new Hono<MiddlewareVars>()
clients.use("/*", authMiddleware)

clients.get("/me", async (ctx) => {
  try {
    const client = await unaryCall<GetClientResponse>((callback) => clientGrpcClient.getClient({ sessionId: ctx.get("session_id") }, callback))
    return ctx.json({
      fullName: client.fullName,
      email: client.email,
      balance: formatCents(client.moneyAmountInCents),
    })
  } catch (error) {
    if (isGrpcServiceError(error)) throw grpcErrorToHttp(error)
    throw error
  }
})

export default clients
