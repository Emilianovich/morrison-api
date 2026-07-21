import net from "node:net"
import { z } from "zod"
import env from "../helpers/env.js"
import { bookGrpcClient } from "../grpc/clients.js"
import type { RestockBookResponse } from "../generated/books.js"
import { domainCode, unaryCall } from "../utils/grpc.js"
import {sendWebSocketEvent} from "../services/WebSocketService.js";

const messageSchema = z.object({
  bookId: z.uuid(),
  amountBooks: z.number().int().positive(),
})

async function processMessage(raw: string): Promise<string> {
  const parts = raw.trim().split(/\s+/)
  if (parts.length !== 2) return "ERROR INVALID_MESSAGE"
  const parsed = messageSchema.safeParse({ bookId: parts[0], amountBooks: Number(parts[1]) })
  if (!parsed.success) return "ERROR INVALID_MESSAGE"

  try {
    const response = await unaryCall<RestockBookResponse>((callback) => bookGrpcClient.restockBook(parsed.data, callback))
    await sendWebSocketEvent({
      type: "stock_change",
      books: [{ id: parsed.data.bookId, stockRemaining: response.currentBookAmount }],
    }).catch(console.error)
    return `OK ${response.bookTitle} ${response.currentBookAmount}`
  } catch (error) {
    return `ERROR ${domainCode(error)}`
  }
}

export function startTcpServer(): net.Server {
  const server = net.createServer((socket) => {
    socket.setEncoding("utf8")
    let buffer = ""

    socket.on("data", async (chunk) => {
      socket.pause()

      try {
        buffer += chunk

        const messages = buffer.split("\n")
        buffer = messages.pop() ?? ""

        for (const message of messages) {
          if (!message.trim()) continue

          const response = await processMessage(message)
          console.log(response)
          socket.write(`${response}\n`)
        }
      } finally {
        socket.resume()
      }
    })
    socket.on("end", () => {
      console.log("TCP client disconnected")
    })

    server.on("error", (error) => {
      console.error("TCP server error", error)
    })
  })

  server.listen(env.TCP_PORT, "0.0.0.0", () => {
    console.log(`TCP server listening on 0.0.0.0:${env.TCP_PORT}`)
  })
  return server
}
