import env from "../helpers/env.js"

type WebSocketEvent =
    | {
  type: "purchase_approved"
  sessionId: string
  quantity: number
  bookId: string
  bookTitle: string
  booksLeft: number
}
    | {
  type: "purchase_denied"
  sessionId: string
  bookTitle: string
  reason: string
}
    | {
  type: "stock_change"
  books: Array<{
    id: string
    stockRemaining: number
  }>
}

export async function sendWebSocketEvent(
    event: WebSocketEvent,
): Promise<void> {
  const url =
      `${env.EVENT_SERVER_PROTOCOL}://` +
      `${env.EVENT_SERVER_HOST}:` +
      `${env.EVENT_SERVER_PORT}` +
      env.EVENT_SERVER_PATH

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
    signal: AbortSignal.timeout(5_000),
  })

  if (!response.ok) {
    const responseBody = await response.text()

    throw new Error(
        `No se pudo enviar el evento WebSocket: ` +
        `${response.status} ${responseBody}`,
    )
  }
}