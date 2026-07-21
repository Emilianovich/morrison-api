export type MiddlewareVars = {
  Variables: {
    session_id: string
  }
}

export type GenerateInvoiceProps = {
  invoiceId: string
  clientId: string
  bookId: string
  bookTitle: string
  invoiceTotalInCents: number
  unitPriceInCents: number
  amountOfBooks: number
}
