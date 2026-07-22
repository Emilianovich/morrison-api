import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import { z } from "zod"
import { bookGrpcClient } from "../grpc/clients.js"
import type { Book, BuyBookResponse, GetAllBooksResponse, GetOneBookResponse } from "../generated/books.js"
import authMiddleware from "../middlewares/auth.js"
import ZodMiddleware from "../middlewares/zod.js"
import FileService from "../services/FileService.js"
import MailService from "../services/MailService.js"
import type { MiddlewareVars } from "../types/middleware-vars.js"
import { categoryFromName, categoryNames, categoryToName } from "../utils/categories.js"
import { domainCode, grpcErrorToHttp, isGrpcServiceError, unaryCall } from "../utils/grpc.js"
import { formatCents } from "../utils/money.js"
import {sendWebSocketEvent} from "../services/WebSocketService.js";

const books = new Hono<MiddlewareVars>()
const fileService = new FileService()
const mailService = new MailService()

books.use("/*", authMiddleware)

const querySchema = z
    .object({
      category: z
          .union([
            z.string({
              error: "La categoría debe enviarse como texto",
            }),
            z.array(
                z.string({
                  error: "Cada categoría debe ser un texto válido",
                }),
            ),
          ])
          .optional(),

      minPrice: z.coerce
          .number({
            error: "El precio mínimo debe ser un número",
          })
          .int({
            error: "El precio mínimo debe ser un número entero",
          })
          .nonnegative({
            error: "El precio mínimo no puede ser negativo",
          })
          .optional(),

      maxPrice: z.coerce
          .number({
            error: "El precio máximo debe ser un número",
          })
          .int({
            error: "El precio máximo debe ser un número entero",
          })
          .nonnegative({
            error: "El precio máximo no puede ser negativo",
          })
          .optional(),
    })
    .refine(
        (value) =>
            value.minPrice === undefined ||
            value.maxPrice === undefined ||
            value.minPrice <= value.maxPrice,
        {
          message:
              "El precio mínimo no puede ser mayor que el precio máximo",
          path: ["minPrice"],
        },
    )

const buySchema = z.object({
  bookId: z.uuid({
    error: "El identificador del libro debe ser un UUID válido",
  }),

  quantity: z.coerce
      .number({
        error: "La cantidad debe ser un número",
      })
      .int({
        error: "La cantidad debe ser un número entero",
      })
      .positive({
        error: "La cantidad debe ser mayor que cero",
      }),
})

function mapBook(book: Book) {
  return {
    id: book.id,
    synopsis: book.synopsis,
    title: book.title,
    author: book.author,
    price: formatCents(book.priceInCents),
    stock: book.stock,
    categories: book.categories.map(categoryToName),
  }
}

async function getBook(sessionId: string, bookId: string) {
  const response = await unaryCall<GetOneBookResponse>((callback) => bookGrpcClient.getOneBook({ sessionId, bookId }, callback))
  if (!response.book) throw new Error("El servidor gRPC devolvió un libro vacío")
  return response.book
}

books.get("/", ZodMiddleware("query", querySchema), async (ctx) => {
  const query = ctx.req.valid("query")
  const rawCategories = query.category === undefined ? [] : Array.isArray(query.category) ? query.category : query.category.split(",")
  const categories = rawCategories.map((name) => {
    const normalized = name.trim().toLowerCase()
    if (!categoryNames.includes(normalized)) throw new HTTPException(400, { message: `Categoría inválida: ${name}` })
    return categoryFromName(normalized)!
  })

  try {
    const response = await unaryCall<GetAllBooksResponse>((callback) => bookGrpcClient.getAllBooks({
      sessionId: ctx.get("session_id"),
      category: categories,
      minPriceInCents: query.minPrice,
      maxPriceInCents: query.maxPrice,
    }, callback))
    const rawBooks = response.books.filter(book => book.stock > 0).sort((a,b) => a.priceInCents - b.priceInCents)
    return ctx.json(rawBooks.map(mapBook))
  } catch (error) {
    if (isGrpcServiceError(error)) throw grpcErrorToHttp(error)
    throw error
  }
})

books.get("/:id", async (ctx) => {
  const parsedId = z.uuid().safeParse(ctx.req.param("id"))
  if (!parsedId.success) throw new HTTPException(400, { message: "El id del libro no es un UUID válido" })
  const bookId = parsedId.data
  try {
    return ctx.json(mapBook(await getBook(ctx.get("session_id"), bookId)))
  } catch (error) {
    if (isGrpcServiceError(error)) throw grpcErrorToHttp(error)
    throw error
  }
})

books.post("/buy", ZodMiddleware("json", buySchema), async (ctx) => {
  const sessionId = ctx.get("session_id")
  const { bookId, quantity } = ctx.req.valid("json")
  let bookTitle = bookId

  try {
    bookTitle = (await getBook(sessionId, bookId)).title

    const purchase = await unaryCall<BuyBookResponse>((callback) =>
        bookGrpcClient.buyBook(
            {
              sessionId,
              bookId,
              quantity,
            },
            callback,
        ),
    )

    const invoice = await fileService.createInvoice({
      invoiceId: purchase.invoiceId,
      clientId: purchase.clientId,
      bookId: purchase.bookId,
      bookTitle: purchase.bookTitle,
      invoiceTotalInCents: purchase.invoiceTotalInCents,
      unitPriceInCents: purchase.unitPriceInCents,
      amountOfBooks: purchase.amountOfBooks,
    })

    const sideEffects = await Promise.allSettled([
      fileService.saveInvoice(invoice),

      mailService.sendInvoiceEmail({
        filename: invoice.fileName,
        bytesArray: invoice.bytesArray,
        clientEmail: purchase.clientEmail,
        bookTitle: purchase.bookTitle,
        invoiceTotalInCents: purchase.invoiceTotalInCents,
        amountOfBooks: purchase.amountOfBooks,
      }),

      sendWebSocketEvent({
        type: "purchase_approved",
        sessionId,
        quantity: purchase.amountOfBooks,
        bookId: purchase.bookId,
        bookTitle: purchase.bookTitle,
        booksLeft: purchase.remainingStock,
      }),

      sendWebSocketEvent({
        type: "stock_change",
        books: [
          {
            id: purchase.bookId,
            stockRemaining: purchase.remainingStock,
          },
        ],
      }),
    ])

    for (const effect of sideEffects) {
      if (effect.status === "rejected") {
        console.error(
            "Post-purchase side effect failed",
            effect.reason,
        )
      }
    }

    return ctx.json("Compra procesada exitosamente",
        201,
    )
  } catch (error) {
    if (isGrpcServiceError(error)) {
      const reason = domainCode(error)

      if (
          [
            "INSUFFICIENT_STOCK",
            "INSUFFICIENT_BALANCE",
            "INVALID_QUANTITY",
            "BOOK_NOT_FOUND",
          ].includes(reason)
      ) {
        await sendWebSocketEvent({
          type: "purchase_denied",
          sessionId,
          bookTitle,
          reason,
        }).catch((notificationError) => {
          console.error(
              "Failed to send purchase_denied event",
              notificationError,
          )
        })
      }

      throw grpcErrorToHttp(error)
    }

    throw error
  }
})

export default books
